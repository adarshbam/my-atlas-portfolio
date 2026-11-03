import { manifest } from "./day06-common.mjs";
const result = await manifest();
console.log(JSON.stringify({ run: result.run, files: result.records.length, build: result.records.filter((record) => record.path.startsWith("dist/assets/")) }));
