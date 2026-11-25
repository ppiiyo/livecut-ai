import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE } from '../data/presets';
import {
  BACKUP_SCHEMA_VERSION,
  exportStateBackupJson,
  parseStateBackupJson,
  parseStoredPipelineState,
  serializeStateWithoutSecrets
} from './storage';
import { validateChannelSlug, validatePipelineForExport } from './validation';

test('validateChannelSlug enforces Twitch/Kick and YouTube rules', () => {
  assert.equal(validateChannelSlug('twitch', 'caseoh_'), null);
  assert.notEqual(validateChannelSlug('twitch', '@bad!'), null);
  assert.notEqual(validateChannelSlug('kick', 'ab'), null);
  assert.equal(validateChannelSlug('youtube', '@IShowSpeed'), null);
  assert.notEqual(validateChannelSlug('youtube', 'bad handle'), null);
});

test('validatePipelineForExport catches invalid repo or profile handles', () => {
  const valid = validatePipelineForExport(DEFAULT_STATE);
  assert.equal(valid.valid, true);

  const invalid = validatePipelineForExport({
    ...DEFAULT_STATE,
    general: { ...DEFAULT_STATE.general, perfil_tiktok: 'bad handle!' },
    repo: { ...DEFAULT_STATE.repo, githubUser: 'bad user' }
  });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.length, 2);
});

test('storage strips secrets on serialize and falls back cleanly on malformed JSON shapes', () => {
  const withSecrets = {
    ...DEFAULT_STATE,
    env: { ...DEFAULT_STATE.env, anthropicKey: 'sk-ant-secret', telegramBotToken: '123:tok' }
  };
  const serialized = serializeStateWithoutSecrets(withSecrets);
  assert.equal(serialized.includes('sk-ant-secret'), false);
  assert.equal(serialized.includes('123:tok'), false);

  const restored = parseStoredPipelineState(serialized);
  assert.equal(restored.env.anthropicKey, '');
  assert.equal(restored.channels.length, DEFAULT_STATE.channels.length);

  // Malformed shape (channels not an array / invalid layout 'split')
  assert.deepEqual(parseStoredPipelineState('{"channels": "broken"}'), DEFAULT_STATE);
  const legacyWithSplit = JSON.stringify({
    ...DEFAULT_STATE,
    channels: [{ ...DEFAULT_STATE.channels[0], layout: 'split' }]
  });
  assert.deepEqual(parseStoredPipelineState(legacyWithSplit), DEFAULT_STATE);
});

test('backup export/import roundtrips state without secrets and rejects invalid backups', () => {
  const customState = {
    ...DEFAULT_STATE,
    general: { ...DEFAULT_STATE.general, perfil_tiktok: '@my_custom_clipper' },
    env: { ...DEFAULT_STATE.env, anthropicKey: 'sk-ant-do-not-export' }
  };
  const json = exportStateBackupJson(customState);
  assert.equal(json.includes('sk-ant-do-not-export'), false);

  const parsedEnvelope = JSON.parse(json) as { schemaVersion: number };
  assert.equal(parsedEnvelope.schemaVersion, BACKUP_SCHEMA_VERSION);

  const okResult = parseStateBackupJson(json);
  assert.equal(okResult.ok, true);
  if (okResult.ok) {
    assert.equal(okResult.state.general.perfil_tiktok, '@my_custom_clipper');
    assert.equal(okResult.state.env.anthropicKey, '');
  }

  const wrongVersion = parseStateBackupJson(JSON.stringify({ schemaVersion: 99, state: customState }));
  assert.equal(wrongVersion.ok, false);

  const invalidJson = parseStateBackupJson('{not json');
  assert.equal(invalidJson.ok, false);

  const invalidShape = parseStateBackupJson(
    JSON.stringify({ schemaVersion: BACKUP_SCHEMA_VERSION, state: { presetId: 'unknown' } })
  );
  assert.equal(invalidShape.ok, false);
});
