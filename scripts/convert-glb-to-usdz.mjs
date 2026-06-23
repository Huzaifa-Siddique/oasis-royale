import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MODEL_NAME = process.argv[2] || 'pizza';
const MODEL_PATH = resolve(__dirname, '..', `public/models/${MODEL_NAME}.glb`);
const OUTPUT_PATH = resolve(__dirname, '..', `public/models/${MODEL_NAME}.usdz`);

// ---- mock browser APIs needed by three.js USDZExporter at runtime ---- //

globalThis.self = globalThis;

const _imageDataMap = new Map();
let _imgIdCounter = 1;

class MockImage {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    this.complete = true;
    this._dataId = _imgIdCounter++;
  }
}

globalThis.HTMLImageElement = MockImage;
globalThis.Image = MockImage;

globalThis.document = {
  createElementNS(ns, name) {
    if (name === 'canvas') return createMockCanvas();
    if (name === 'img') return new MockImage();
    return {};
  },
  createElement(name) {
    if (name === 'canvas') return createMockCanvas();
    if (name === 'img') return new MockImage();
    return {};
  },
};

function createMockCanvas() {
  let _image = null;
  let _w = 0;
  let _h = 0;

  const ctx = {
    drawImage(img, ...args) {
      _image = img;
      if (args.length >= 4) {
        _w = Math.round(args[2]);
        _h = Math.round(args[3]);
      } else {
        _w = img.width || 0;
        _h = img.height || 0;
      }
    },
    translate() {},
    scale() {},
  };

  return {
    width: 0,
    height: 0,
    getContext() { return ctx; },
    toBlob(cb) {
      const raw = _imageDataMap.get(_image?._dataId);
      if (raw && _w > 0 && _h > 0) {
        // Detect transparency
        let hasAlpha = false;
        for (let i = 3; i < raw.length; i += 4) {
          if (raw[i] < 255) {
            hasAlpha = true;
            break;
          }
        }
        
        if (hasAlpha) {
          sharp(raw, { raw: { width: _w, height: _h, channels: 4 } })
            .png()
            .toBuffer()
            .then((buf) => cb(new Blob([buf], { type: 'image/png' })))
            .catch(() => cb(new Blob([])));
        } else {
          sharp(raw, { raw: { width: _w, height: _h, channels: 4 } })
            .jpeg({ quality: 85 })
            .toBuffer()
            .then((buf) => cb(new Blob([buf], { type: 'image/jpeg' })))
            .catch(() => cb(new Blob([])));
        }
      } else {
        sharp({ create: { width: 1, height: 1, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } })
          .jpeg({ quality: 85 })
          .toBuffer()
          .then((buf) => cb(new Blob([buf], { type: 'image/jpeg' })))
          .catch(() => cb(new Blob([])));
      }
    },
  };
}

// ---- three.js + USDZExporter imports ---- //

import * as THREE from 'three';
import { USDZExporter } from './USDZExporter.js';

// ---- GLB reader ---- //

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco3d from 'draco3dgltf';

function decodeImageRGBA(buf, mimeType) {
  const pipeline = sharp(buf);
  if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
    return pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  }
  return pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

function buildMeshStandardMaterial(gltfMat, texMap) {
  const m = new THREE.MeshStandardMaterial();
  m.name = gltfMat.getName();

  const specGloss = gltfMat.getExtension('KHR_materials_pbrSpecularGlossiness');

  const baseColor = specGloss ? specGloss.getDiffuseFactor() : gltfMat.getBaseColorFactor();
  m.color.setRGB(baseColor[0], baseColor[1], baseColor[2]);
  m.opacity = baseColor[3];
  m.transparent = baseColor[3] < 1 || gltfMat.getAlphaMode() === 'BLEND';

  m.roughness = specGloss ? 0.8 : gltfMat.getRoughnessFactor();
  m.metalness = specGloss ? 0.1 : gltfMat.getMetallicFactor();

  const emissive = gltfMat.getEmissiveFactor();
  m.emissive.setRGB(emissive[0], emissive[1], emissive[2]);

  const alphaMode = gltfMat.getAlphaMode();
  if (alphaMode === 'MASK') m.alphaTest = gltfMat.getAlphaCutoff();
  m.side = gltfMat.getDoubleSided() ? THREE.DoubleSide : THREE.FrontSide;

  const baseTex = specGloss ? specGloss.getDiffuseTexture() : gltfMat.getBaseColorTexture();
  if (baseTex && texMap.has(baseTex)) m.map = texMap.get(baseTex);

  const normTex = gltfMat.getNormalTexture();
  if (normTex && texMap.has(normTex)) {
    m.normalMap = texMap.get(normTex);
    m.normalScale = new THREE.Vector2(gltfMat.getNormalScale(), gltfMat.getNormalScale());
  }

  const emissiveTex = gltfMat.getEmissiveTexture();
  if (emissiveTex && texMap.has(emissiveTex)) m.emissiveMap = texMap.get(emissiveTex);

  const occTex = gltfMat.getOcclusionTexture();
  if (occTex && texMap.has(occTex)) m.aoMap = texMap.get(occTex);

  const mrTex = gltfMat.getMetallicRoughnessTexture();
  if (mrTex && texMap.has(mrTex)) {
    m.metalnessMap = texMap.get(mrTex);
    m.roughnessMap = texMap.get(mrTex);
  }

  return m;
}

function toVec3(arr) {
  return new THREE.Vector3(arr[0], arr[1], arr[2]);
}

function toQuat(arr) {
  return new THREE.Quaternion(arr[0], arr[1], arr[2], arr[3]);
}

async function buildThreeScene(doc) {
  const root = doc.getRoot();
  const scene = new THREE.Scene();

  const texMap = new Map();

  for (const gltfTex of root.listTextures()) {
    const imageBuf = gltfTex.getImage();
    if (!imageBuf) continue;
    const { data, info } = await decodeImageRGBA(imageBuf, gltfTex.getMimeType());

    const img = new MockImage();
    img.width = info.width;
    img.height = info.height;
    _imageDataMap.set(img._dataId, new Uint8Array(data));

    const threeTex = new THREE.DataTexture(data, info.width, info.height);
    threeTex.image = img;
    threeTex.needsUpdate = true;
    texMap.set(gltfTex, threeTex);
  }

  const matMap = new Map();
  for (const gltfMat of root.listMaterials()) {
    matMap.set(gltfMat, buildMeshStandardMaterial(gltfMat, texMap));
  }

  const nodeMap = new Map();
  for (const gltfNode of root.listNodes()) {
    const obj = new THREE.Object3D();
    obj.name = gltfNode.getName();
    obj.position.copy(toVec3(gltfNode.getTranslation()));
    obj.quaternion.copy(toQuat(gltfNode.getRotation()));
    obj.scale.copy(toVec3(gltfNode.getScale()));
    nodeMap.set(gltfNode, obj);
  }

  for (const gltfNode of root.listNodes()) {
    const parent = gltfNode.getParentNode();
    if (parent && nodeMap.has(parent)) {
      nodeMap.get(parent).add(nodeMap.get(gltfNode));
    }
  }

  for (const gltfNode of root.listNodes()) {
    const gltfMesh = gltfNode.getMesh();
    if (!gltfMesh) continue;
    const obj = nodeMap.get(gltfNode);
    if (!obj) continue;

    for (const prim of gltfMesh.listPrimitives()) {
      const geom = new THREE.BufferGeometry();

      const pos = prim.getAttribute('POSITION');
      if (pos) geom.setAttribute('position', new THREE.Float32BufferAttribute(pos.getArray().slice(), 3));

      const norm = prim.getAttribute('NORMAL');
      if (norm) geom.setAttribute('normal', new THREE.Float32BufferAttribute(norm.getArray().slice(), 3));

      const uv = prim.getAttribute('TEXCOORD_0');
      if (uv) geom.setAttribute('uv', new THREE.Float32BufferAttribute(uv.getArray().slice(), 2));

      const indices = prim.getIndices();
      if (indices) {
        const arr = indices.getArray();
        if (arr instanceof Uint16Array || arr instanceof Uint32Array) {
          geom.setIndex(new THREE.BufferAttribute(arr.slice(), 1));
        } else {
          geom.setIndex(new THREE.BufferAttribute(new Uint32Array(arr).slice(), 1));
        }
      }

      const threeMat = matMap.get(prim.getMaterial()) || new THREE.MeshStandardMaterial();
      const mesh = new THREE.Mesh(geom, threeMat);
      mesh.name = gltfMesh.getName();
      obj.add(mesh);
    }
  }

  const defaultScene = root.getDefaultScene();
  if (defaultScene) {
    for (const child of defaultScene.listChildren()) {
      if (nodeMap.has(child)) scene.add(nodeMap.get(child));
    }
  } else {
    for (const gltfNode of root.listNodes()) {
      if (!gltfNode.getParentNode() && nodeMap.has(gltfNode)) {
        scene.add(nodeMap.get(gltfNode));
      }
    }
  }

  return scene;
}

async function main() {
  const decoderModule = await draco3d.createDecoderModule();
  const encoderModule = await draco3d.createEncoderModule();

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': decoderModule,
      'draco3d.encoder': encoderModule,
    });
  const doc = await io.read(MODEL_PATH);

  const scene = await buildThreeScene(doc);

  // CRITICAL: Update all node transformation matrices before export
  scene.updateMatrixWorld(true);

  const exporter = new USDZExporter();
  const arrayBuffer = await exporter.parseAsync(scene, {
    quickLookCompatible: true,
    includeAnchoringProperties: false,
  });

  await writeFile(OUTPUT_PATH, Buffer.from(arrayBuffer));
  console.log('USDZ written to', OUTPUT_PATH);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
