import test from 'node:test';
import assert from 'node:assert/strict';
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

test('generated DEFAULT_STATE artifacts match golden snapshots', () => {
  const actual: Record<string, string> = {
    'config.toml': generateConfigToml(DEFAULT_STATE),
    '.env.example': generateEnvFile(DEFAULT_STATE, false),
    'apply_en_patch.py': generatePatchScript(DEFAULT_STATE),
    'SETUP_RU.md': generateSetupGuide(DEFAULT_STATE),
    'README.md': generateReadme(DEFAULT_STATE)
  };

  for (const [filename, content] of Object.entries(actual)) {
    const goldenPath = path.join(GOLDEN_DIR, filename);
    assert.equal(
      fs.existsSync(goldenPath),
      true,
      `Missing golden snapshot tests/golden/${filename}. Run npm run test:golden:update.`
    );
    const expected = fs.readFileSync(goldenPath, 'utf8');
    assert.equal(
      content,
      expected,
      `Golden mismatch in tests/golden/${filename}. Run npm run test:golden:update if intentional.`
    );
  }
});
