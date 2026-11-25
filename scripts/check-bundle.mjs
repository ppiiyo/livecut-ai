import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML = path.join(DIST_DIR, 'index.html');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');
const MAX_INITIAL_JS_GZIP_KB = 250;

if (!fs.existsSync(INDEX_HTML)) {
  console.error('dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}

const html = fs.readFileSync(INDEX_HTML, 'utf8');
const entryScriptMatches = [...html.matchAll(/<script[^>]+src="[^"]*\/assets\/([^"]+\.js)"/g)];

if (entryScriptMatches.length === 0) {
  console.error('No entry script found in dist/index.html');
  process.exit(1);
}

let totalInitialGzipBytes = 0;

for (const match of entryScriptMatches) {
  const filename = match[1];
  const filePath = path.join(ASSETS_DIR, filename);
  const content = fs.readFileSync(filePath);
  const gzipBytes = zlib.gzipSync(content, { level: 9 }).length;
  totalInitialGzipBytes += gzipBytes;
  console.log(
    `Initial JS: ${filename} — raw ${(content.length / 1024).toFixed(2)} KB, gzip ${(gzipBytes / 1024).toFixed(2)} KB`
  );
}

const limitBytes = MAX_INITIAL_JS_GZIP_KB * 1024;
const totalKb = (totalInitialGzipBytes / 1024).toFixed(2);

if (totalInitialGzipBytes > limitBytes) {
  console.error(
    `Bundle budget exceeded: initial JS gzip ${totalKb} KB > ${MAX_INITIAL_JS_GZIP_KB} KB`
  );
  process.exit(1);
}

console.log(`Bundle budget OK: initial JS gzip ${totalKb} KB <= ${MAX_INITIAL_JS_GZIP_KB} KB`);
