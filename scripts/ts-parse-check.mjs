import ts from "typescript";
const program = ts.createProgram(["client/src/App.tsx"], { jsx: ts.JsxEmit.ReactJSX, allowJs: false, noEmit: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext });
const diagnostics = ts.getPreEmitDiagnostics(program).filter(d => d.file?.fileName.endsWith("App.tsx"));
for (const diagnostic of diagnostics.slice(0, 12)) {
  const start = diagnostic.start ?? 0;
  const line = diagnostic.file.getLineAndCharacterOfPosition(start);
  console.log(JSON.stringify({ code: diagnostic.code, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, " "), line: line.line + 1, column: line.character + 1 }, null, 2));
}
