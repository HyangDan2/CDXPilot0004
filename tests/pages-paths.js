import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import http from "node:http";
import { TRACKS } from "../js/music.js";
const root = new URL("../", import.meta.url);
const paths = new Set(["index.html", "assets/tracks.json", ".nojekyll"]);
async function scan(dir) {
  for (const entry of await readdir(new URL(dir, root), {
    withFileTypes: true,
  })) {
    const path = dir + entry.name;
    if (entry.isDirectory()) await scan(path + "/");
    else if (/\.(html|css|js)$/.test(path)) {
      paths.add(path);
      const text = await readFile(new URL(path, root), "utf8");
      const refs = [
        ...text.matchAll(
          /(?:src|href)=["']([^"']+)["']|url\(["']?([^"')]+)|(?:from\s+|import\s*)["']([^"']+)["']/g,
        ),
      ];
      for (const match of refs) {
        const ref = match[1] || match[2] || match[3];
        if (/^(data:|https?:|#)/.test(ref)) continue;
        assert(
          !ref.startsWith("/"),
          "Root-absolute asset: " + path + " " + ref,
        );
        if (!ref.startsWith(".") && !match[1] && !match[2]) continue;
        const url = new URL(ref, new URL(path, root));
        const relative = decodeURIComponent(
          url.pathname.slice(root.pathname.length),
        );
        if (!relative) paths.add("index.html");
        else
          paths.add(
            relative.endsWith("/") ? relative + "index.html" : relative,
          );
      }
    }
  }
}
for (const dir of ["js/", "css/", "tools/", "tests/"]) await scan(dir);
// HTML root references and all dynamically selected assets.
paths.add("css/style.css");
paths.add("js/main.js");
for (const track of TRACKS) {
  paths.add(track.audio.replace(/^\.\//, ""));
  for (const lanes of [4, 6])
    for (const difficulty of ["easy", "normal", "hard", "expert"])
      paths.add(
        `assets/beatmaps/library/${track.id}-${lanes}-${difficulty}.json`,
      );
}
for (const path of paths) {
  let directory = root;
  for (const part of path.split("/")) {
    assert(
      (await readdir(directory)).includes(part),
      "Exact-case asset missing: " + path,
    );
    directory = new URL(part + "/", directory);
  }
}
const request = (url) =>
  new Promise((resolve, reject) =>
    http
      .get(url, (response) => {
        let bytes = 0;
        response.on("data", (chunk) => (bytes += chunk.length));
        response.on("end", () =>
          resolve({
            status: response.statusCode,
            headers: response.headers,
            bytes,
          }),
        );
      })
      .on("error", reject),
  );
for (const prefix of ["/CDXPilot0004", "/renamed-project"]) {
  const child = spawn(process.execPath, ["scripts/serve.mjs"], {
    cwd: root,
    env: { ...process.env, PORT: "0", BASE_PATH: prefix },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    const url = await new Promise((resolve, reject) => {
      child.stdout.once("data", (data) =>
        resolve(data.toString().match(/http:\/\/\S+/)[0]),
      );
      child.once("error", reject);
      child.once("exit", (code) => reject(new Error("Server exited " + code)));
    });
    const redirect = await request(url.slice(0, -1));
    assert.equal(redirect.status, 301);
    assert.equal(redirect.headers.location, prefix + "/");
    for (const path of paths)
      assert.equal(
        (await request(new URL(path, url))).status,
        200,
        prefix + "/" + path,
      );
    assert.equal(
      (await request(new URL("/assets/tracks.json", url))).status,
      404,
      "Root paths must not accidentally pass",
    );
    console.log(
      `PASS ${prefix}/: ${paths.size} exact-case pages/assets, 10 MP3s, 80 charts, trailing-slash redirect`,
    );
  } finally {
    child.kill();
  }
}
