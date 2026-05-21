import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTs from "eslint-config-next/typescript.js";

const nextVitalsExtends = Array.isArray(nextVitals)
  ? nextVitals
  : nextVitals && nextVitals.extends
  ? nextVitals.extends
  : [];
const nextTsExtends = Array.isArray(nextTs)
  ? nextTs
  : nextTs && nextTs.extends
  ? nextTs.extends
  : [];

const eslintConfig = defineConfig([
  ...nextVitalsExtends,
  ...nextTsExtends,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
