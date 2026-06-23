import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { metalRough } from '@gltf-transform/functions';
import path from 'path';
import { fileURLToPath } from 'url';
import draco3d from 'draco3dgltf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODEL_PATH = path.join(__dirname, '..', 'public/models/fruit_cream_cake.glb');

async function main() {
  console.log(`Loading model from ${MODEL_PATH}...`);
  const decoderModule = await draco3d.createDecoderModule();
  const encoderModule = await draco3d.createEncoderModule();

  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': decoderModule,
      'draco3d.encoder': encoderModule,
    });

  const doc = await io.read(MODEL_PATH);

  console.log('Extensions in document BEFORE transform:');
  const extsBefore = doc.getRoot().listExtensionsUsed();
  if (extsBefore.length === 0) {
    console.log('  (none)');
  }
  for (const ext of extsBefore) {
    console.log(`- ${ext.extensionName}`);
  }

  console.log('Running metalRough transform...');
  await doc.transform(metalRough());

  console.log('Extensions in document AFTER transform:');
  const extsAfter = doc.getRoot().listExtensionsUsed();
  if (extsAfter.length === 0) {
    console.log('  (none)');
  }
  for (const ext of extsAfter) {
    console.log(`- ${ext.extensionName}`);
  }

  console.log('Saving model back...');
  await io.write(MODEL_PATH, doc);
  console.log('Done!');
}

main().catch((err) => {
  console.error('Error during transformation:', err);
  process.exit(1);
});
