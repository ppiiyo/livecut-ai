import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_STATE } from '../src/data/presets';
import {
  generateConfigToml,
  generateEnvFile,
  generatePatchScript,
  generateReadme,
  generateSetupGuide
} from '../src/utils/generator';
import { createZipBytes } from '../src/utils/zip';

const OUT_DIR = path.resolve(process.cwd(), 'kit-dist');
fs.mkdirSync(OUT_DIR, { recursive: true });

const files = [
  { name: 'apply_en_patch.py', content: generatePatchScript(DEFAULT_STATE) },
  { name: 'config.toml', content: generateConfigToml(DEFAULT_STATE) },
  { name: '.env.example', content: generateEnvFile(DEFAULT_STATE, false) },
  { name: 'SETUP_RU.md', content: generateSetupGuide(DEFAULT_STATE) },
  { name: 'README.md', content: generateReadme(DEFAULT_STATE) }
];

for (const file of files) {
  fs.writeFileSync(path.join(OUT_DIR, file.name), file.content, 'utf8');
}

const zipBytes = createZipBytes(files);
fs.writeFileSync(path.join(OUT_DIR, 'livecut-en-kit.zip'), zipBytes);
console.log(`Generated ${files.length} kit artifacts and livecut-en-kit.zip (${zipBytes.length} bytes) in kit-dist/`);
