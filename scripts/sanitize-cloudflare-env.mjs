import { readFileSync, writeFileSync, existsSync } from "node:fs";
import ts from "typescript";

// Worker secrets come from Cloudflare bindings, never a Vercel/dotenv build snapshot.
const file = ".open-next/cloudflare/next-env.mjs";
if (!existsSync(file)) throw new Error("OpenNext environment module was not generated.");
let source = readFileSync(file, "utf8");
const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const edits = [];
function visit(node) {
  if (ts.isVariableDeclaration(node) && ["production", "development", "test"].includes(node.name.getText(tree))
    && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
    const publicValues = {};
    for (const entry of node.initializer.properties) {
      if (!ts.isPropertyAssignment(entry) || !ts.isStringLiteral(entry.initializer)) continue;
      const key = entry.name.text;
      if (key.startsWith("NEXT_PUBLIC_")) publicValues[key] = entry.initializer.text;
    }
    edits.push({ start: node.initializer.getStart(tree), end: node.initializer.end, value: JSON.stringify(publicValues) });
  }
  ts.forEachChild(node, visit);
}
visit(tree);
if (!edits.length) throw new Error("Unexpected OpenNext environment module; refusing to retain private build defaults.");
for (const edit of edits.sort((a, b) => b.start - a.start)) source = source.slice(0, edit.start) + edit.value + source.slice(edit.end);
writeFileSync(file, source);
console.log(`Cloudflare runtime environment sanitized (${edits.length} modules). Secrets remain in bindings.`);
