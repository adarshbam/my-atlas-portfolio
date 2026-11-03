import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

export const run = process.env.DAY06_RUN ?? "baseline";
if (!/^[a-z0-9-]+$/.test(run)) throw new Error("Invalid Day 6 run name");
export const output = `docs/review/day06/${run}`;
export const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
await mkdir(output, { recursive: true });
export async function json(name, data) {
  await writeFile(
    `${output}/${name}.json`,
    JSON.stringify(data, null, 2) + "\n",
  );
}
export async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(`${directory}/${entry.name}`)
          : `${directory}/${entry.name}`,
      ),
    )
  ).flat();
}
export async function identities(paths) {
  return Promise.all(
    paths.map(async (path) => {
      const data = await readFile(path);
      return {
        path,
        bytes: data.length,
        sha256: createHash("sha256").update(data).digest("hex"),
        ...(/dist\/assets\/.*\.js$/.test(path)
          ? { gzipBytes: gzipSync(data).length }
          : {}),
      };
    }),
  );
}
export async function manifest() {
  const source = ["src", "tests", "scripts", "public"];
  const paths = (await Promise.all(source.map(files)))
    .flat()
    .concat(
      [
        "package.json",
        "package-lock.json",
        "index.html",
        "vite.config.ts",
        "playwright.config.ts",
        "tsconfig.json",
      ],
      await files("dist"),
    );
  const result = {
    date: new Date().toISOString(),
    run,
    baseURL,
    records: await identities(paths.sort()),
  };
  await json("manifest", result);
  return result;
}
