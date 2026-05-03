import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

/** @type {import('eslint').Linter.FlatConfig[]} */
const eslintConfig = [
    {
        ignores: [".next/*", "node_modules/*", "dist/*"],
    },
    // We only use the core-web-vitals here, but we avoid the circular ref
    // by ensuring we are using the latest compat layer
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "react/no-unescaped-entities": "off",
            "@next/next/no-img-element": "warn",
        },
    },
];

export default eslintConfig;
