// ESLint: kodstandarden i verktyg. Säkerhetsregler + egna regler ur docs/standard.md.
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
// Säkerhetsregler (SAST, SAL F4): gratis paket som fångar farlig kod tidigt
const security = require("eslint-plugin-security");

module.exports = tseslint.config(
  // Granska inte byggfiler, paket eller den här filen själv
  { ignores: ["dist/", "node_modules/", "eslint.config.js"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  security.configs.recommended,
  {
    rules: {
      // Regel ur docs/standard.md: SQL byggs aldrig med ${}
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='query'] > TemplateLiteral[expressions.length>0]",
          message: "SQL får inte byggas med ${}. Använd $1 och skicka värdet i en lista: db.query(sql, [värde]). Se docs/standard.md.",
        },
      ],
    },
  },
);
