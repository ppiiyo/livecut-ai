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

const GOLDEN_DIR = path.resolve(process.cwd(), 'tests/golden');
fs.mkdirSync(GOLDEN_DIR, { recursive: true });

const artifacts: Record<string, string> = {
  'config.toml': generateConfigToml(DEFAULT_STATE),
  '.env.example': generateEnvFile(DEFAULT_STATE, false),
  'apply_en_patch.py': generatePatchScript(DEFAULT_STATE),
  'SETUP_RU.md': generateSetupGuide(DEFAULT_STATE),
  'README.md': generateReadme(DEFAULT_STATE)
};

for (const [name, content] of Object.entries(artifacts)) {
  fs.writeFileSync(path.join(GOLDEN_DIR, name), content, 'utf8');
  console.log(`Updated tests/golden/${name} (${content.length} bytes)`);
}
