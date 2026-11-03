import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = "C:/Users/Dell/Desktop/Projects/my-storage-frontend";
const manifestDirectory = process.argv[2] ?? "docs/evidence/vault";
const blobs = JSON.parse(await readFile(`${manifestDirectory}/remote-blobs.json`, "utf8"));
const files = [];
for (const remote of blobs) {
  const bytes = await readFile(`${root}/${remote.path}`);
  // Git normalizes CRLF to LF for these working files. Record both hashes.
  const normalized = Buffer.from(
    bytes.toString("utf8").replaceAll("\r\n", "\n"),
  );
  const gitBlob = createHash("sha1")
    .update(`blob ${normalized.length}\0`)
    .update(normalized)
    .digest("hex");
  files.push({
    path: remote.path,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    gitBlob,
    remoteBlob: remote.sha,
    matchesRemote: gitBlob === remote.sha,
  });
}
await writeFile(
  `${manifestDirectory}/source-manifest.json`,
  JSON.stringify(
    {
      reviewed: "2026-10-25",
      repository: "adarshbam/my-storage",
      note: "Remote Git blob identities obtained through GitHub connector; no commit SHA or deployed-revision equivalence claimed.",
      files,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify(
    files.map(({ path, matchesRemote }) => ({ path, matchesRemote })),
    null,
    2,
  ),
);
