import eslintPluginImport from "eslint-plugin-import";
import typescriptParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "node_modules/",
      ".pnpm-store/",
      ".turbo/",
      "dist/",
      "build/",
      "coverage/",
      "target/",
      "src-tauri/target/",
      "*.sqlite",
      "*.db",
      "pnpm-lock.yaml",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      sourceType: "module",
      ecmaVersion: 2022,
    },
    plugins: {
      import: eslintPluginImport,
    },
    rules: {
      "import/no-anonymous-default-export": "warn",
      "import/no-cycle": "error",
      "import/no-extraneous-dependencies": "error",
      "import/no-unresolved": "warn",
      "import/newline-after-import": "warn",
      "import/order": "warn",
    },
  },
];
