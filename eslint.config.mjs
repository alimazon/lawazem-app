// eslint.config.mjs
import { globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    rules: {
      // React 19's new rule is too strict for client-side data fetching.
      // Next.js's own docs still recommend useEffect for this pattern.
      "react-hooks/set-state-in-effect": "off",
      // We use <img> for user-uploaded Supabase images. next/image would
      // require configuring remotePatterns and would add Vercel costs.
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
];

export default eslintConfig;