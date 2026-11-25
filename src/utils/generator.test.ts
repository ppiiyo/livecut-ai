import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE } from '../data/presets';
import {
  estimateMonthlyCost,
  generateConfigToml,
  generateEnvFile,
  generatePatchScript,
  reactionPart,
  safeDoubleTriple,
  safeTriple,
  simulateRateSpike,
  spamTermToRegex,
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

  const opusDefaultCap = estimateMonthlyCost(200, 'claude-opus-5-5', 5.0, false);
  assert.equal(opusDefaultCap.effectiveDailyAnalyses, 125);

  const sonnetManual = estimateMonthlyCost(40, 'claude-sonnet-5-5', 5.0, true);
  assert.equal(sonnetManual.costPerAnalysisUsd, 0.02);
  assert.equal(sonnetManual.effectiveDailyAnalyses, 22);
  assert.equal(sonnetManual.dailyUsd, 0.44);
});

test('safeTriple and safeDoubleTriple escape backslashes before triple quotes', () => {
  assert.equal(safeTriple('D:\\new'), 'D:\\\\new');
  assert.equal(safeTriple("'''"), "\\'\\'\\'");
  assert.equal(safeDoubleTriple('C:\\clips\\"""'), 'C:\\\\clips\\\\\\"\\"\\"');

  const withWinPath = {
    ...DEFAULT_STATE,
    general: { ...DEFAULT_STATE.general, pasta_dados: 'D:\\new_clips' }
  };
  const script = generatePatchScript(withWinPath);
  assert.ok(script.includes('pasta_dados = "D:\\\\\\\\new_clips"'));
});

test('reactionPart and generatePatchScript handle emoji and mixed boundaries without \\b on emoji', () => {
  assert.equal(reactionPart('💀'), 'r"💀"');
  assert.equal(reactionPart('lol💀'), 'r"\\blol💀"');
  assert.equal(reactionPart('no way'), 'r"\\bno way\\b"');

  const script = generatePatchScript({
    ...DEFAULT_STATE,
    extraReactions: ['💀', 'lol💀', 'no way']
  });
  assert.equal(script.includes('\\b💀\\b'), false);
  assert.ok(script.includes('r"💀"'));
  assert.ok(script.includes('r"\\blol💀"'));
});

test('testChatMessage detects EN/RU reactions and avoids substring false positives on spam', () => {
  const reactionHit = testChatMessage('NO WAY he is cooked 💀', ['no way', 'cooked'], ['use code']);
  assert.equal(reactionHit.isReaction, true);
  assert.equal(reactionHit.isSpam, false);
  assert.equal(reactionHit.verdict, 'trigger_candidate');
  assert.ok(reactionHit.matchedReactions.includes('no way'));
  assert.ok(reactionHit.matchedReactions.includes('cooked'));

  const neutralPixel = testChatMessage('pixel art is public here', [], []);
  assert.equal(neutralPixel.isSpam, false);
  assert.equal(neutralPixel.verdict, 'neutral');

  const spamHit = testChatMessage('use code SPEED', [], ['use code']);
  assert.equal(spamHit.isSpam, true);
  assert.equal(spamHit.verdict, 'ignored_spam');

  const stemSpamHit = testChatMessage('subscribe now for free', [], ['subscrib*']);
  assert.equal(stemSpamHit.isSpam, true);
  assert.equal(stemSpamHit.verdict, 'ignored_spam');
  assert.equal(spamTermToRegex('subscrib*'), '\\bsubscrib\\w*');
  assert.equal(spamTermToRegex('pix'), '\\bpix\\b');
});

test('simulateRateSpike evaluates standard and large chat triggers accurately', () => {
  const standardHit = simulateRateSpike(DEFAULT_STATE.detector, 1, 4, 30);
  assert.equal(standardHit.triggered, true);
  assert.equal(standardHit.isLargeChat, false);

  const standardMiss = simulateRateSpike(DEFAULT_STATE.detector, 1, 2, 10);
  assert.equal(standardMiss.triggered, false);

  const largeChatHit = simulateRateSpike(DEFAULT_STATE.detector, 6, 9, 40);
  assert.equal(largeChatHit.isLargeChat, true);
  assert.equal(largeChatHit.triggered, true);
});

test('generateConfigToml reflects updated channels, facecam coords, manual mode, and handle', () => {
  const custom = {
    ...DEFAULT_STATE,
    general: { ...DEFAULT_STATE.general, perfil_tiktok: '@gta6clips', layout_video: 'noticia' as const },
    ai: { ...DEFAULT_STATE.ai, aprovacao_manual: false, nota_minima: 7 },
    channels: [
      ...DEFAULT_STATE.channels,
      {
        id: 'ch-custom-cam',
        nome: 'CustomCam',
        plataforma: 'twitch' as const,
        canal: 'customcam',
        idioma: 'en' as const,
        layout: 'facecam' as const,
        facecam: [0.02, 0.65, 0.25, 0.3] as [number, number, number, number],
        deteccao: 'ambos' as const,
        min_msgs: 25,
        enabled: true
      }
    ]
  };
  const toml = generateConfigToml(custom);
  assert.match(toml, /perfil_tiktok = "@gta6clips"/);
  assert.match(toml, /layout_video = "noticia"/);
  assert.match(toml, /aprovacao_manual = false/);
  assert.match(toml, /nota_minima = 7/);
  assert.match(toml, /nome = "IShowSpeed"/);
  assert.match(toml, /layout = "fundo"/);
  assert.match(toml, /layout = "facecam"/);
  assert.match(toml, /facecam = \[0\.02, 0\.65, 0\.25, 0\.3\]/);
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

test('generatePatchScript preserves existing config.toml and validates TOML via tomllib', () => {
  const script = generatePatchScript(DEFAULT_STATE);
  assert.match(script, /def patch\(rel, old, new/);
  assert.match(script, /"gta6", "gta", "fyp", "shorts"/);
  assert.match(script, /SYSTEM_PROMPT = """/);
  assert.match(script, /ast\.parse\(out\)/);
  assert.ok(script.includes('write_new("config.toml", CONFIG, "config.toml")'));
  assert.equal(script.includes('write_new("config.toml", CONFIG, "config.toml", overwrite=True)'), false);
  assert.ok(script.includes('tomllib.loads(content)'));
});
