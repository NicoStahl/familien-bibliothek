// Flat Config direkt aus eslint-config-next — derselbe Weg wie bei Kochkiste. Der frühere
// Umweg über FlatCompat (@eslint/eslintrc) lässt ESLint 9 mit eslint-config-next 16 mit
// "Converting circular structure to JSON" abstürzen; der Linter läuft dann gar nicht.
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "data/**", "cover/**", "public/**", "design/**"] },
  ...coreWebVitals,
  ...typescript,
];

export default eslintConfig;
