/* eslint-env node */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    // Principio IV de la constitución: camelCase para funciones/variables,
    // PascalCase para interfaces y tipos.
    "@typescript-eslint/naming-convention": [
      "warn",
      {
        selector: ["variableLike", "function"],
        format: ["camelCase", "UPPER_CASE"],
        leadingUnderscore: "allow",
      },
      {
        selector: ["typeLike"],
        format: ["PascalCase"],
      },
    ],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
};
