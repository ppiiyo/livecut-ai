import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE } from '../data/presets';
import {
  estimateMonthlyCost,
  generateConfigToml,
  generateEnvFile,
  generatePatchScript,
  testChatMessage
} from './generator';

test('estimateMonthlyCost calculates opus and sonnet costs accurately with budget cap', () => {
  const opusAuto = estimateMonthlyCost(50, 'claude-opus-5-5', 5.0, false);
  assert.equal(opusAuto.costPerAnalysisUsd, 0.04);
  assert.equal(opusAuto.dailyUsd, 2.0);
  assert.equal(opusAuto.monthlyUsd, 60.0);
  assert.equal(opusAuto.cappedByBudget, false);

  const opusCapped = estimateMonthlyCost(200, 'claude-opus-5-5', 2.0, false);
  assert.equal(opusCapped.cappedByBudget, true);
  assert.equal(opusCapped.effectiveDailyAnalyses, 50);
  assert.equal(opusCapped.dailyUsd, 2.0);

  const sonnetManual = estimateMonthlyCost(40, 'claude-sonnet-5-5', 5.0, true);
  assert.equal(sonnetManual.costPerAnalysisUsd, 0.02);
  assert.equal(sonnetManual.effectiveDailyAnalyses, 22);
  assert.equal(sonnetManual.dailyUsd, 0.44);
});

test('testChatMessage detects EN/RU reactions and filters giveaway/promo spam', () => {
  const reactionHit = testChatMessage('NO WAY he is cooked right now 💀', ['no way', 'cooked'], ['use code']);
  assert.equal(reactionHit.isReaction, true);
  assert.equal(reactionHit.isSpam, false);
  assert.equal(reactionHit.verdict, 'trigger_candidate');
  assert.ok(reactionHit.matchedReactions.includes('no way'));
  assert.ok(reactionHit.matchedReactions.includes('cooked'));

  const spamHit = testChatMessage('NO WAY use code SPEED for 20% off', ['no way'], ['use code']);
  assert.equal(spamHit.isSpam, true);
  assert.equal(spamHit.isReaction, false);
  assert.equal(spamHit.verdict, 'ignored_spam');
  assert.ok(spamHit.matchedSpam.includes('use code'));

  const neutralHit = testChatMessage('hello everyone how is the stream today', ['no way'], ['use code']);
  assert.equal(neutralHit.verdict, 'neutral');
});

test('generateConfigToml reflects updated channels, manual mode, and handle', () => {
  const custom = {
    ...DEFAULT_STATE,
    general: { ...DEFAULT_STATE.general, perfil_tiktok: '@gta6clips', layout_video: 'noticia' as const },
    ai: { ...DEFAULT_STATE.ai, aprovacao_manual: false, nota_minima: 7 }
  };
  const toml = generateConfigToml(custom);
  assert.match(toml, /perfil_tiktok = "@gta6clips"/);
  assert.match(toml, /layout_video = "noticia"/);
  assert.match(toml, /aprovacao_manual = false/);
  assert.match(toml, /nota_minima = 7/);
  assert.match(toml, /nome = "IShowSpeed"/);
  assert.match(toml, /layout = "fundo"/);
});

test('generateEnvFile masks secrets by default and includes model selection', () => {
  const withSecret = {
    ...DEFAULT_STATE,
    ai: { ...DEFAULT_STATE.ai, model: 'claude-sonnet-5-5' as const },
    env: { ...DEFAULT_STATE.env, anthropicKey: 'sk-ant-secret-123' }
  };
  const safeTemplate = generateEnvFile(withSecret, false);
  assert.match(safeTemplate, /CLAUDE_MODEL=claude-sonnet-5-5/);
  assert.equal(safeTemplate.includes('sk-ant-secret-123'), false);

  const filled = generateEnvFile(withSecret, true);
  assert.match(filled, /ANTHROPIC_API_KEY=sk-ant-secret-123/);
});

test('generatePatchScript embeds customized tags, reactions, and TOML safely', () => {
  const script = generatePatchScript(DEFAULT_STATE);
  assert.match(script, /def patch\(rel, old, new/);
  assert.match(script, /"gta6", "gta", "fyp", "shorts"/);
  assert.match(script, /SYSTEM_PROMPT = """/);
  assert.match(script, /ast\.parse\(out\)/);
});
