import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import path from 'path';
import { fileURLToPath } from 'url';
import draco3d from 'draco3dgltf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const modelName = process.argv[2] || 'fruit_cream_cake';
const MODEL_PATH = path.join(__dirname, '..', `public/models/${modelName}.glb`);

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

  console.log(`Model: ${path.basename(MODEL_PATH)}`);
  console.log(`Materials count: ${root.listMaterials().length}`);
  
  for (const mat of root.listMaterials()) {
    console.log(`\nMaterial name: "${mat.getName()}"`);
    console.log(`- Base Color Factor: [${mat.getBaseColorFactor().join(', ')}]`);
    console.log(`- Roughness Factor: ${mat.getRoughnessFactor()}`);
    console.log(`- Metallic Factor: ${mat.getMetallicFactor()}`);
    
    const baseColorTex = mat.getBaseColorTexture();
    if (baseColorTex) {
      console.log(`- Base Color Texture: YES (mimeType: ${baseColorTex.getMimeType()})`);
    } else {
      console.log(`- Base Color Texture: NO`);
    }

    const normalTex = mat.getNormalTexture();
    if (normalTex) {
      console.log(`- Normal Texture: YES`);
    }
  }
}

main().catch(console.error);
