import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
const tags = [...head.matchAll(/<meta\b[^>]*>/g)].map(m => attrs(m[0]));
const links = [...head.matchAll(/<link\b[^>]*>/g)].map(m => attrs(m[0]));
const meta = key => {
  const values = tags.filter(tag => (tag.property || tag.name) === key);
  assert.equal(values.length, 1, `One static ${key} tag required`);
  assert(values[0].content);
  return values[0].content;
};
const base = "https://hyangdan2.github.io/CDXPilot0004/";
assert.equal(meta("og:url"), base);
assert.equal(links.find(link => link.rel === "canonical").href, base);
assert.equal(meta("og:type"), "website");
assert.equal(meta("twitter:card"), "summary_large_image");
assert.equal(meta("og:title"), meta("twitter:title"));
assert.equal(meta("description"), meta("og:description"));
assert.equal(meta("og:description"), meta("twitter:description"));
assert.equal(meta("og:image"), meta("twitter:image"));
assert.equal(meta("og:image:alt"), meta("twitter:image:alt"));
assert.equal(meta("og:image:type"), "image/png");
const imageURL = new URL(meta("og:image"));
assert(imageURL.href.startsWith(base + "assets/branding/"), "Public image includes repository prefix");
assert.equal(imageURL.search, "");
const pngSize = buffer => {
  assert.equal(buffer.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
};
const card = readFileSync(new URL(imageURL.href.slice(base.length), root));
assert.deepEqual(pngSize(card), [1200, 630]);
assert.equal(Number(meta("og:image:width")), 1200);
assert.equal(Number(meta("og:image:height")), 630);
assert(card.length < 2 * 1024 * 1024, "Keep social image below 2 MiB");
for (const link of links.filter(link => ["icon", "apple-touch-icon"].includes(link.rel))) {
  assert(link.href.startsWith("assets/branding/"), "Icons must use portable project-relative paths");
  const data = readFileSync(new URL(link.href, root));
  if (link.href.endsWith(".png")) {
    assert.deepEqual(pngSize(data), link.sizes.split("x").map(Number));
  } else if (link.href.endsWith(".ico")) {
    assert.equal(data.readUInt16LE(2), 1);
    assert.equal(data.readUInt16LE(4), 3);
    assert.deepEqual([0,1,2].map(i => data[6 + i * 16]).sort((a,b) => a-b), [16,32,48]);
  } else {
    assert(data.toString().includes('viewBox="0 0 64 64"'));
    assert(!/https?:\/\//.test(data.toString().replace('xmlns="http://www.w3.org/2000/svg"', '')), "SVG must be self-contained");
  }
}
assert.equal(links.filter(link => link.rel === "icon").length, 3);
assert.equal(links.filter(link => link.rel === "apple-touch-icon").length, 1);
console.log("PASS sharing: static OG/cards, canonical Pages URL, 1200x630 image, portable SVG/PNG/ICO and Apple icon dimensions");
