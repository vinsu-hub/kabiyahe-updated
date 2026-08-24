import fs from "node:fs";
import { parse } from "@babel/parser";
const source = fs.readFileSync("client/src/App.tsx", "utf8");
try {
  parse(source, { sourceType: "module", plugins: ["typescript", "jsx"] });
  console.log("parse ok");
} catch (error) {
  console.log(JSON.stringify({ message: error.message, loc: error.loc }, null, 2));
}
