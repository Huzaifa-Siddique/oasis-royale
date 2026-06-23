import { execSync } from 'child_process';

const modelsConfig = [
  { name: 'pizza', metersPerUnit: 0.01, pivotScale: 1.0, roughness: 0.8 },
  { name: 'cookie', metersPerUnit: 0.01, pivotScale: 1.0, roughness: 0.9 },
  { name: 'shawarma_deal-v2', metersPerUnit: 1.0, pivotScale: 1.0, roughness: 0.7 },
  { name: 'creamed_coffee', metersPerUnit: 1.0, pivotScale: 1.0, roughness: 0.2 },
  { name: 'coffee_mug_school_project', metersPerUnit: 0.05, pivotScale: 1.0, roughness: 0.3 },
  { name: 'fruit_cream_cake', metersPerUnit: 0.01, pivotScale: 1.0, roughness: 0.5 },
  { name: 'latte_art', metersPerUnit: 0.15, pivotScale: 1.0, roughness: 0.4 }
];

console.log('Starting pivot correction, GLB-to-USDZ conversion, and post-processing...');

for (const cfg of modelsConfig) {
  const model = cfg.name;
  try {
    console.log(`\n==========================================`);
    console.log(`Processing model: ${model}`);
    console.log(`==========================================`);

    // Step 1: Run pivot correction on GLB
    console.log(`Running pivot correction for ${model}...`);
    const pivotOut = execSync(`node scripts/fix-model-pivot.mjs public/models/${model}.glb ${cfg.pivotScale}`, { encoding: 'utf8' });
    console.log(pivotOut);

    // Step 2: Run GLB to USDZ conversion
    console.log(`Converting ${model}.glb to ${model}.usdz...`);
    const convertOut = execSync(`node scripts/convert-glb-to-usdz.mjs ${model}`, { encoding: 'utf8' });
    console.log(convertOut);

    // Step 3: Run USDZ compatibility fix script with target metersPerUnit, roughness, forceOpaque, and isUnlit options
    console.log(`Running USDZ final compatibility fix for ${model} with metersPerUnit = ${cfg.metersPerUnit}, roughness = ${cfg.roughness}, forceOpaque = ${cfg.forceOpaque || false}, isUnlit = ${cfg.isUnlit || false}...`);
    const fixOut = execSync(`python scripts/fix-usdz-final.py ${model} ${cfg.metersPerUnit} ${cfg.roughness} ${cfg.forceOpaque || false} ${cfg.isUnlit || false}`, { encoding: 'utf8' });
    console.log(fixOut);

    console.log(`Successfully processed ${model}!`);
  } catch (err) {
    console.error(`Error processing model ${model}:`, err.message);
    if (err.stdout) console.error('stdout:', err.stdout);
    if (err.stderr) console.error('stderr:', err.stderr);
  }
}

console.log('\nAll conversions completed.');
