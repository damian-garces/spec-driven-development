module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  env: {
    browser: true,
    es2022: true,
  },
  rules: {
    // Principio IV: componentes de UI como funciones + Hooks, nunca como
    // `class extends React.Component`. No prohíbe clases en general: una
    // subclase de `Error` (ver apiClient.ts, errorHandler.ts) es la única
    // forma idiomática de tipar errores con `instanceof` en JS/TS, y por lo
    // tanto cuenta como "estrictamente obligatoria por una dependencia
    // externa" (el propio lenguaje).
    "no-restricted-syntax": [
      "error",
      {
        selector: "ClassDeclaration[superClass.property.name=/^(Component|PureComponent)$/], ClassDeclaration[superClass.name=/^(Component|PureComponent)$/]",
        message: "Usar componentes funcionales y Hooks en lugar de class components (Principio IV).",
      },
    ],
    "@typescript-eslint/naming-convention": [
      "warn",
      {
        selector: ["variableLike", "function"],
        format: ["camelCase", "PascalCase", "UPPER_CASE"],
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
