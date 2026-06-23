import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import path from 'path';
import { fileURLToPath } from 'url';
import draco3d from 'draco3dgltf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, '..', 'public/models/pizza.glb');

function transformPoint(m, v) {
  const [x, y, z] = v;
  const w = 1;
  return [
    m[0] * x + m[4] * y + m[8]  * z + m[12] * w,
    m[1] * x + m[5] * y + m[9]  * z + m[13] * w,
    m[2] * x + m[6] * y + m[10] * z + m[14] * w,
  ];
}

function findPath(currentNode, target) {
  if (currentNode === target) return [target];
  for (const child of currentNode.listChildren()) {
    const sub = findPath(child, target);
    if (sub) return [currentNode, ...sub];
  }
  return null;
}

function getNodeChain(node, rootNodes) {
  for (const root of rootNodes) {
    const found = findPath(root, node);
    if (found) return found;
  }
  return [node];
}

function fmt(v) {
  if (!v) return 'null';
  if (v.length === 4) {
    return '[' + v.map(n => n.toFixed(6)).join(', ') + ']';
  }
  return '[' + v.map(n => n.toFixed(6)).join(', ') + ']';
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

  const root = doc.getRoot();
  const scenes = root.listScenes();
  const allNodes = root.listNodes();
  const allMeshes = root.listMeshes();

  console.log('='.repeat(80));
  console.log('MODEL:', path.basename(MODEL_PATH));
  console.log('='.repeat(80));

  // ---- 1. Scene structure ----
  console.log('\n' + '#'.repeat(40));
  console.log('#  SCENE STRUCTURE');
  console.log('#'.repeat(40));
  for (const [si, scene] of scenes.entries()) {
    console.log('\nScene ' + si + ': "' + scene.getName() + '"');
    const sceneChildren = scene.listChildren();
    if (sceneChildren.length === 0) {
      console.log('  (no children)');
    }
    for (const child of sceneChildren) {
      printNodeTree(child, 2);
    }
  }

  // ---- 2. All nodes with transforms ----
  console.log('\n' + '#'.repeat(40));
  console.log('#  ALL NODES');
  console.log('#'.repeat(40));
  for (const node of allNodes) {
    const t = node.getTranslation();
    const r = node.getRotation();
    const s = node.getScale();
    const hasMesh = node.getMesh() ? '  MESH: "' + node.getMesh().getName() + '"' : '';
    const parentInfo = node.getParentNode()
      ? '  PARENT: "' + node.getParentNode().getName() + '"'
      : '  PARENT: (scene root or none)';
    console.log('\nNode: "' + node.getName() + '"');
    console.log('  Translation: ' + fmt(t));
    console.log('  Rotation:    ' + fmt(r));
    console.log('  Scale:       ' + fmt(s));
    const childNames = node.listChildren().map(c => '"' + c.getName() + '"').join(', ') || '(none)';
    console.log('  Children:    ' + childNames);
    console.log(parentInfo);
    if (hasMesh) console.log(hasMesh);
  }

  // ---- 3. Per-mesh node chains ----
  console.log('\n' + '#'.repeat(40));
  console.log('#  MESH NODE CHAINS (top-down)');
  console.log('#'.repeat(40));

  const sceneRootNodes = [];
  for (const scene of scenes) {
    sceneRootNodes.push(...scene.listChildren());
  }

  for (const mesh of allMeshes) {
    console.log('\nMesh: "' + mesh.getName() + '"');
    const refNodes = allNodes.filter(n => n.getMesh() === mesh);
    if (refNodes.length === 0) {
      console.log('  (not referenced by any node)');
      continue;
    }
    for (const refNode of refNodes) {
      const chain = getNodeChain(refNode, sceneRootNodes);
      console.log('  Node chain for "' + refNode.getName() + '":');
      chain.forEach((n, i) => {
        const indent = '    ' + '  '.repeat(i);
        const t = n.getTranslation();
        const r = n.getRotation();
        const s = n.getScale();
        console.log(indent + '-> "' + n.getName() + '"  T=' + fmt(t) + '  R=' + fmt(r) + '  S=' + fmt(s));
      });
    }
  }

  // ---- 4. World-space Y bounds per primitive ----
  console.log('\n' + '#'.repeat(40));
  console.log('#  WORLD-SPACE Y BOUNDS');
  console.log('#'.repeat(40));

  let overallLocalMinY = Infinity;
  let overallLocalMaxY = -Infinity;
  let overallWorldMinY = Infinity;
  let overallWorldMaxY = -Infinity;

  for (const mesh of allMeshes) {
    const refNodes = allNodes.filter(n => n.getMesh() === mesh);
    if (refNodes.length === 0) continue;

    for (const [pi, prim] of mesh.listPrimitives().entries()) {
      const pos = prim.getAttribute('POSITION');
      if (!pos) {
        console.log('\nMesh "' + mesh.getName() + '" prim ' + pi + ': no POSITION attribute');
        continue;
      }
      const arr = pos.getArray();
      if (!arr) {
        console.log('\nMesh "' + mesh.getName() + '" prim ' + pi + ': empty POSITION array');
        continue;
      }

      let localMinY = Infinity;
      let localMaxY = -Infinity;
      for (let i = 1; i < arr.length; i += 3) {
        const y = arr[i];
        if (y < localMinY) localMinY = y;
        if (y > localMaxY) localMaxY = y;
      }
      if (localMinY < overallLocalMinY) overallLocalMinY = localMinY;
      if (localMaxY > overallLocalMaxY) overallLocalMaxY = localMaxY;

      for (const refNode of refNodes) {
        const worldMat = refNode.getWorldMatrix();
        let worldMinY = Infinity;
        let worldMaxY = -Infinity;
        for (let i = 0; i < arr.length; i += 3) {
          const localPos = [arr[i], arr[i + 1], arr[i + 2]];
          const worldPos = transformPoint(worldMat, localPos);
          if (worldPos[1] < worldMinY) worldMinY = worldPos[1];
          if (worldPos[1] > worldMaxY) worldMaxY = worldPos[1];
        }

        console.log('\nMesh "' + mesh.getName() + '" prim ' + pi + ' via node "' + refNode.getName() + '":');
        console.log('  Local  Y: [' + localMinY.toFixed(6) + ', ' + localMaxY.toFixed(6) + ']');
        console.log('  World Y:  [' + worldMinY.toFixed(6) + ', ' + worldMaxY.toFixed(6) + ']');
        console.log('  World matrix:');
        const m = worldMat;
        console.log('    [' + m[0].toFixed(6) + ', ' + m[4].toFixed(6) + ', ' + m[8].toFixed(6) + ', ' + m[12].toFixed(6) + ']');
        console.log('    [' + m[1].toFixed(6) + ', ' + m[5].toFixed(6) + ', ' + m[9].toFixed(6) + ', ' + m[13].toFixed(6) + ']');
        console.log('    [' + m[2].toFixed(6) + ', ' + m[6].toFixed(6) + ', ' + m[10].toFixed(6) + ', ' + m[14].toFixed(6) + ']');
        console.log('    [' + m[3].toFixed(6) + ', ' + m[7].toFixed(6) + ', ' + m[11].toFixed(6) + ', ' + m[15].toFixed(6) + ']');

        if (worldMinY < overallWorldMinY) overallWorldMinY = worldMinY;
        if (worldMaxY > overallWorldMaxY) overallWorldMaxY = worldMaxY;
      }
    }
  }

  // ---- 5. Summary ----
  console.log('\n' + '#'.repeat(40));
  console.log('#  SUMMARY');
  console.log('#'.repeat(40));
  console.log('\nOverall LOCAL  Y bounds: [' + overallLocalMinY.toFixed(6) + ', ' + overallLocalMaxY.toFixed(6) + ']');
  console.log('Overall WORLD  Y bounds: [' + overallWorldMinY.toFixed(6) + ', ' + overallWorldMaxY.toFixed(6) + ']');
  console.log('\nIf overall WORLD Y min is negative, the model extends below Y=0 in world space.');
  console.log('If it is 0 (or positive), the model sits at or above Y=0 in world space.');

  // ---- 6. Also print raw bounds of each accessor ----
  console.log('\n' + '#'.repeat(40));
  console.log('#  ACCESSOR MIN/MAX (local)');
  console.log('#'.repeat(40));
  for (const mesh of allMeshes) {
    for (const [pi, prim] of mesh.listPrimitives().entries()) {
      const pos = prim.getAttribute('POSITION');
      if (!pos) continue;
      const min = pos.getMin([0, 0, 0]);
      const max = pos.getMax([0, 0, 0]);
      console.log('\nMesh "' + mesh.getName() + '" prim ' + pi + ' POSITION accessor:');
      console.log('  Min: ' + fmt(min));
      console.log('  Max: ' + fmt(max));
    }
  }
}

function printNodeTree(node, indent) {
  const prefix = ' '.repeat(indent);
  const t = node.getTranslation();
  const r = node.getRotation();
  const s = node.getScale();
  const meshName = node.getMesh() ? ' [mesh: "' + node.getMesh().getName() + '"]' : '';
  console.log(prefix + '- "' + node.getName() + '"' + meshName);
  console.log(prefix + '  T=' + fmt(t) + '  R=' + fmt(r) + '  S=' + fmt(s));
  for (const child of node.listChildren()) {
    printNodeTree(child, indent + 2);
  }
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});