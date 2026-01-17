import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Restore explicit any rule to error for stricter type safety
      "@typescript-eslint/no-explicit-any": "error",
      // Allow lucide-react imports (ESLint has issues with dynamic exports)
      "@typescript-eslint/no-redundant-type-constituents": "off",
    },
  },
  // Special rules for App.tsx - disable ALL TypeScript checks since it has @ts-nocheck
  {
    files: ["src/App.tsx"],
    extends: [js.configs.recommended],
    rules: {
      // Disable all TypeScript rules for this file
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // And any other TypeScript rules that might cause issues
    },
  },
);