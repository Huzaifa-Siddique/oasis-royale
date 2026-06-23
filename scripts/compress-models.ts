import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, flatten, instance, join, palette, simplify, textureCompress, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import * as path from 'path';
import * as fs from 'fs';

const MODELS_DIR = path.resolve(__dirname, '..', 'public', 'models');

async function main() {
  // Wait for the WebAssembly module of meshoptimizer to initialize
  await MeshoptSimplifier.ready;

  // Initialize Draco modules for decoding/encoding Draco compressed meshes
  const decoderModule = await draco3d.createDecoderModule();
  const encoderModule = await draco3d.createEncoderModule();

  // Register all extensions and Draco dependencies
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': decoderModule,
      'draco3d.encoder': encoderModule,
    });

  const files = fs.readdirSync(MODELS_DIR).filter(f => f.endsWith('.glb'));

  for (const file of files) {
    const filePath = path.join(MODELS_DIR, file);
    const originalSize = fs.statSync(filePath).size;
    console.log(`[${file}] Original size: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);

    // Read the 3D model document
    const doc = await io.read(filePath);

    // Apply the transformation pipeline
    await doc.transform(
      weld({}), // Merges split vertices, crucial for simplify to work cleanly
      join(), // Merges multiple meshes and primitives to reduce draw calls and simplify hierarchy
      dedup(),
      instance({ min: 5 }),
      palette({ min: 5 }),
      flatten(),
      // Triangle reduction (ratio 0.4 keeps 40%, deleting 60% of triangles)
      simplify({
        simplifier: MeshoptSimplifier,
        ratio: file === 'latte_art.glb' ? 0.05 : (file === 'sub_mid_poly.glb' ? 0.15 : 0.4),
        error: 0.01
      }),

      // Compress and resize textures to 1024x1024 WebP
      textureCompress({
        targetFormat: 'webp',
        resize: [1024, 1024]
      })
    );

    // Write the compressed model back to file system
    await io.write(filePath, doc);

    const newSize = fs.statSync(filePath).size;
    const pct = ((1 - newSize / originalSize) * 100).toFixed(1);
    console.log(`[${file}] Compressed size: ${(newSize / 1024 / 1024).toFixed(2)}MB (${pct}% reduction)`);
  }

  console.log('All models processed successfully.');
}

main().catch((err) => {
  console.error('Compression failed:', err);
  process.exit(1);
});
