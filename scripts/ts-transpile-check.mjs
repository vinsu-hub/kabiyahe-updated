import fs from "node:fs";
import ts from "typescript";
const source = fs.readFileSync("client/src/App.tsx", "utf8");
const output = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true, fileName: "App.tsx" });
for (const diagnostic of output.diagnostics ?? []) {
  const start = diagnostic.start ?? 0;
  const line = source.slice(0, start).split("\n").length;
  const column = start - source.lastIndexOf("\n", start);
  console.log(JSON.stringify({ code: diagnostic.code, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "), line, column }, null, 2));
}
