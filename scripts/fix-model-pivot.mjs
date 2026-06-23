import { NodeIO, MathUtils } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import path from 'path';
import { fileURLToPath } from 'url';
import draco3d from 'draco3dgltf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '..', 'public/models/pizza.glb');

const SCALE_FACTOR = process.argv[3] ? parseFloat(process.argv[3]) : 1.0;
console.log(`Using scale factor: ${SCALE_FACTOR}`);

function transformPoint(mat, p) {
  return [
    mat[0] * p[0] + mat[4] * p[1] + mat[8] * p[2] + mat[12],
    mat[1] * p[0] + mat[5] * p[1] + mat[9] * p[2] + mat[13],
    mat[2] * p[0] + mat[6] * p[1] + mat[10] * p[2] + mat[14],
  ];
}

function transformNormal(mat, n) {
  const x = mat[0] * n[0] + mat[4] * n[1] + mat[8] * n[2];
  const y = mat[1] * n[0] + mat[5] * n[1] + mat[9] * n[2];
  const z = mat[2] * n[0] + mat[6] * n[1] + mat[10] * n[2];
  const len = Math.sqrt(x * x + y * y + z * z);
  return [x / len, y / len, z / len];
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

  const meshNodes = doc.getRoot().listNodes().filter((n) => n.getMesh());
  if (meshNodes.length === 0) {
    throw new Error('No mesh-carrying nodes found in model');
  }

  let globalMinX = Infinity, globalMaxX = -Infinity;
  let globalMinY = Infinity, globalMaxY = -Infinity;
  let globalMinZ = Infinity, globalMaxZ = -Infinity;

  // ── Phase 1: bake world transform into vertex data ──

  for (const node of meshNodes) {
    const wm = node.getWorldMatrix();
    const mesh = node.getMesh();

    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      if (pos) {
        const arr = pos.getArray();
        if (arr) {
          const v = [0, 0, 0];
          for (let i = 0; i < arr.length; i += 3) {
            v[0] = arr[i]; v[1] = arr[i + 1]; v[2] = arr[i + 2];
            const t = transformPoint(wm, v);
            const sx = t[0] * SCALE_FACTOR;
            const sy = t[1] * SCALE_FACTOR;
            const sz = t[2] * SCALE_FACTOR;
            arr[i] = sx; arr[i + 1] = sy; arr[i + 2] = sz;
            if (sx < globalMinX) globalMinX = sx;
            if (sx > globalMaxX) globalMaxX = sx;
            if (sy < globalMinY) globalMinY = sy;
            if (sy > globalMaxY) globalMaxY = sy;
            if (sz < globalMinZ) globalMinZ = sz;
            if (sz > globalMaxZ) globalMaxZ = sz;
          }
          pos.setArray(arr);
        }
      }

      const norm = prim.getAttribute('NORMAL');
      if (norm) {
        const arrN = norm.getArray();
        if (arrN) {
          const nv = [0, 0, 0];
          for (let i = 0; i < arrN.length; i += 3) {
            nv[0] = arrN[i]; nv[1] = arrN[i + 1]; nv[2] = arrN[i + 2];
            const tn = transformNormal(wm, nv);
            arrN[i] = tn[0]; arrN[i + 1] = tn[1]; arrN[i + 2] = tn[2];
          }
          norm.setArray(arrN);
        }
      }

      const tang = prim.getAttribute('TANGENT');
      if (tang) {
        const arrT = tang.getArray();
        if (arrT) {
          const tv = [0, 0, 0];
          for (let i = 0; i < arrT.length; i += 4) {
            tv[0] = arrT[i]; tv[1] = arrT[i + 1]; tv[2] = arrT[i + 2];
            const tt = transformNormal(wm, tv);
            arrT[i] = tt[0]; arrT[i + 1] = tt[1]; arrT[i + 2] = tt[2];
          }
          tang.setArray(arrT);
        }
      }
    }
  }

  if (!isFinite(globalMinY)) {
    throw new Error('No position data found in model');
  }

  console.log(
    `Original bounds: X[${globalMinX.toFixed(4)}, ${globalMaxX.toFixed(4)}], ` +
    `Y[${globalMinY.toFixed(4)}, ${globalMaxY.toFixed(4)}], ` +
    `Z[${globalMinZ.toFixed(4)}, ${globalMaxZ.toFixed(4)}]`,
  );

  // ── Phase 2: centre at origin ──

  const cx = (globalMinX + globalMaxX) / 2;
  const cy = globalMinY;
  const cz = (globalMinZ + globalMaxZ) / 2;

  console.log(`Centring: X-=${cx.toFixed(4)} Y-=${cy.toFixed(4)} Z-=${cz.toFixed(4)}`);

  for (const node of meshNodes) {
    const mesh = node.getMesh();
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      if (pos) {
        const arr = pos.getArray();
        if (arr) {
          for (let i = 0; i < arr.length; i += 3) {
            arr[i] -= cx;
            arr[i + 1] -= cy;
            arr[i + 2] -= cz;
          }
          pos.setArray(arr);
        }
      }
    }
  }

  // ── Phase 3: reset node transforms ──

  for (const node of meshNodes) {
    node.setTranslation([0, 0, 0]);
    node.setRotation([0, 0, 0, 1]);
    node.setScale([1, 1, 1]);
  }

  await io.write(MODEL_PATH, doc);

  // ── Verify ──

  const doc2 = await io.read(MODEL_PATH);
  let nXmin = Infinity, nXmax = -Infinity;
  let nYmin = Infinity, nYmax = -Infinity;
  let nZmin = Infinity, nZmax = -Infinity;

  for (const node of doc2.getRoot().listNodes().filter((n) => n.getMesh())) {
    for (const prim of node.getMesh().listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      if (!pos) continue;
      const arr = pos.getArray();
      if (!arr) continue;
      for (let i = 0; i < arr.length; i += 3) {
        const x = arr[i], y = arr[i + 1], z = arr[i + 2];
        if (x < nXmin) nXmin = x;
        if (x > nXmax) nXmax = x;
        if (y < nYmin) nYmin = y;
        if (y > nYmax) nYmax = y;
        if (z < nZmin) nZmin = z;
        if (z > nZmax) nZmax = z;
      }
    }
  }

  console.log(
    `New bounds: X[${nXmin.toFixed(4)}, ${nXmax.toFixed(4)}], ` +
    `Y[${nYmin.toFixed(4)}, ${nYmax.toFixed(4)}], ` +
    `Z[${nZmin.toFixed(4)}, ${nZmax.toFixed(4)}]`,
  );
  console.log('Pivot fix applied successfully');
}

main().catch((err) => {
  console.error('Failed to fix model pivot:', err);
  process.exit(1);
});
