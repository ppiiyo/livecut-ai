import { ClaudeModelId, DetectorConfig, PipelineState } from '../types/pipeline';

export interface CostEstimate {
  costPerAnalysisUsd: number;
  dailyUsd: number;
  monthlyUsd: number;
  cappedByBudget: boolean;
  effectiveDailyAnalyses: number;
}

export const safeTriple = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/'''/g, "\\'\\'\\'");

export const safeDoubleTriple = (s: string): string =>
  s.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');

export function estimateMonthlyCost(
  clipsPerDay: number,
  model: ClaudeModelId,
  dailyBudgetUsd: number,
  manualMode: boolean
): CostEstimate {
  const costPerAnalysisUsd = model === 'claude-opus-5-5' ? 0.04 : 0.02;
  const safeClips = Math.max(0, Math.round(clipsPerDay));
  // Manual mode typically filters ~45% of noise before calling Claude
  const multiplier = manualMode ? 0.55 : 1;
  const rawDailyAnalyses = Math.round(safeClips * multiplier);
  const maxByBudget =
    costPerAnalysisUsd > 0 && dailyBudgetUsd > 0
      ? Math.floor(dailyBudgetUsd / costPerAnalysisUsd + 1e-9)
      : 0;
  const effectiveDailyAnalyses = Math.min(rawDailyAnalyses, maxByBudget);
  const cappedByBudget = rawDailyAnalyses > maxByBudget && dailyBudgetUsd > 0;
  const dailyUsd = Number((effectiveDailyAnalyses * costPerAnalysisUsd).toFixed(2));
  const monthlyUsd = Number((dailyUsd * 30).toFixed(2));

  return {
    costPerAnalysisUsd,
    dailyUsd,
    monthlyUsd,
    cappedByBudget,
    effectiveDailyAnalyses
  };
}

export interface ChatFilterResult {
  isReaction: boolean;
  matchedReactions: string[];
  isSpam: boolean;
  matchedSpam: string[];
  verdict: 'trigger_candidate' | 'ignored_spam' | 'neutral';
}

const BASE_REACTIONS = [
  'lmao', 'lmfao', 'kekw', 'omegalul', 'lulw', 'wtf', 'bruh', 'bro', 'w', 'gg',
  'kkkk', 'rsrs', 'caralho', '💀', '😂', '🔥', '😭', '🤯'
];

const BASE_SPAM = [
  'link na bio', 'inscrev*', 'resgat*', 'patrocin*', 'publi', 'pix', 'http://', 'https://'
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const reactionPart = (r: string): string => {
  const escaped = escapeRegex(r);
  const lead = /^[\p{L}\p{N}]/u.test(r) ? '\\b' : '';
  const tail = /[\p{L}\p{N}]$/u.test(r) ? '\\b' : '';
  return `r"${lead}${escaped}${tail}"`;
};

export const spamTermToRegex = (t: string): string => {
  const stem = t.endsWith('*');
  const core = escapeRegex(stem ? t.slice(0, -1) : t);
  const lead = /^[\p{L}\p{N}]/u.test(t) ? '\\b' : '';
  if (stem) return `${lead}${core}\\w*`;
  const tail = /[\p{L}\p{N}]$/u.test(t) ? '\\b' : '';
  return `${lead}${core}${tail}`;
};

function buildJsWordRegex(token: string, allowStem: boolean): RegExp {
  const stem = allowStem && token.endsWith('*');
  const rawCore = stem ? token.slice(0, -1) : token;
  const core = escapeRegex(rawCore);
  const lead = /^[\p{L}\p{N}]/u.test(token) ? '(?<![\\p{L}\\p{N}_])' : '';
  if (stem) {
    return new RegExp(`${lead}${core}[\\p{L}\\p{N}_]*`, 'iu');
  }
  const tail = /[\p{L}\p{N}]$/u.test(token) ? '(?![\\p{L}\\p{N}_])' : '';
  return new RegExp(`${lead}${core}${tail}`, 'iu');
}

export function testChatMessage(
  message: string,
  extraReactions: string[],
  extraSpamTerms: string[]
): ChatFilterResult {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      isReaction: false,
      matchedReactions: [],
      isSpam: false,
      matchedSpam: [],
      verdict: 'neutral'
    };
  }

  const allSpam = Array.from(
    new Set([...BASE_SPAM, ...extraSpamTerms.map((s) => s.trim().toLowerCase()).filter(Boolean)])
  );
  const matchedSpam = allSpam.filter((term) => buildJsWordRegex(term, true).test(trimmed));

  const allReactions = Array.from(
    new Set([...BASE_REACTIONS, ...extraReactions.map((r) => r.trim().toLowerCase()).filter(Boolean)])
  );
  const matchedReactions = allReactions.filter((token) => buildJsWordRegex(token, false).test(trimmed));

  const isSpam = matchedSpam.length > 0;
  const isReaction = !isSpam && matchedReactions.length > 0;

  return {
    isReaction,
    matchedReactions,
    isSpam,
    matchedSpam,
    verdict: isSpam ? 'ignored_spam' : isReaction ? 'trigger_candidate' : 'neutral'
  };
}

export interface RateSpikeResult {
  triggered: boolean;
  ratio: number;
  isLargeChat: boolean;
  windowMsgs: number;
  reason: string;
}

export function simulateRateSpike(
  detectorCfg: DetectorConfig,
  baselineMsgsPerSec: number,
  spikeMsgsPerSec: number,
  reactionPct: number
): RateSpikeResult {
  const safeBaseline = Math.max(0, Number.isFinite(baselineMsgsPerSec) ? baselineMsgsPerSec : 0);
  const safeSpike = Math.max(0, Number.isFinite(spikeMsgsPerSec) ? spikeMsgsPerSec : 0);
  const safeReactionPct = Math.max(0, Math.min(100, Number.isFinite(reactionPct) ? reactionPct : 0));
  const reactionFrac = safeReactionPct / 100;

  const denom = Math.max(safeBaseline, 0.3);
  const ratio = Number((safeSpike / denom).toFixed(2));
  const isLargeChat = safeBaseline >= detectorCfg.chat_grande_msgs_s;
  const windowMsgs = Math.round(safeSpike * detectorCfg.janela_segundos);

  if (isLargeChat) {
    const pureSpike = ratio >= 2.5;
    const reactionSpike =
      ratio >= detectorCfg.chat_grande_multiplicador &&
      reactionFrac >= detectorCfg.chat_grande_reacao;
    const triggered = pureSpike || reactionSpike;
    const reason = pureSpike
      ? `Большой чат: всплеск ${ratio.toFixed(2)}× ≥ 2.5× (срабатывает без порога реакций)`
      : reactionSpike
      ? `Большой чат: ${ratio.toFixed(2)}× ≥ ${detectorCfg.chat_grande_multiplicador}× и реакции ${safeReactionPct.toFixed(0)}% ≥ ${(detectorCfg.chat_grande_reacao * 100).toFixed(0)}%`
      : `Недостаточный всплеск для большого чата (${ratio.toFixed(2)}×, реакции ${safeReactionPct.toFixed(0)}%)`;
    return { triggered, ratio, isLargeChat, windowMsgs, reason };
  }

  const pureSpike = ratio >= detectorCfg.multiplicador_forte;
  const reactionSpike =
    ratio >= detectorCfg.multiplicador_minimo &&
    reactionFrac >= detectorCfg.reacao_minima;
  const triggered = pureSpike || reactionSpike;
  const reason = pureSpike
    ? `Сильный всплеск: ${ratio.toFixed(2)}× ≥ ${detectorCfg.multiplicador_forte}×`
    : reactionSpike
    ? `Всплеск ${ratio.toFixed(2)}× ≥ ${detectorCfg.multiplicador_minimo}× и реакции ${safeReactionPct.toFixed(0)}% ≥ ${(detectorCfg.reacao_minima * 100).toFixed(0)}%`
    : `Порог не достигнут (${ratio.toFixed(2)}× при реакциях ${safeReactionPct.toFixed(0)}%)`;

  return { triggered, ratio, isLargeChat, windowMsgs, reason };
}

export function generateConfigToml(state: PipelineState): string {
  const { general, detector, ai, channels } = state;
  const activeChannels = channels.filter((c) => c.enabled);

  const channelBlocks = activeChannels
    .map((ch) => {
      const lines = [
        '[[canais]]',
        `nome = ${JSON.stringify(ch.nome)}`,
        `plataforma = ${JSON.stringify(ch.plataforma)}`,
        `canal = ${JSON.stringify(ch.canal)}`,
        `idioma = ${JSON.stringify(ch.idioma)}`,
        `layout = ${JSON.stringify(ch.layout)}`
      ];
      if (ch.layout === 'facecam' && ch.facecam) {
        const coords = ch.facecam.map((n) => Number(n.toFixed(3))).join(', ');
        lines.push(`facecam = [${coords}]`);
      }
      if (ch.deteccao !== 'chat') {
        lines.push(`deteccao = ${JSON.stringify(ch.deteccao)}`);
      }
      lines.push(`min_msgs = ${ch.min_msgs}`);
      return lines.join('\n');
    })
    .join('\n\n');

  return `# ============================================================
#  ${state.repo.repoName || 'livecut-en'} — конфигурация конвейера livecut-ai
#  Имена ключей (на португальском) читаются модулем settings.py.
#  Секреты и токены хранятся в .env, не здесь.
# ============================================================

[geral]
perfil_tiktok = ${JSON.stringify(general.perfil_tiktok || '@your_handle')}
qualidade = ${JSON.stringify(general.qualidade)}
buffer_minutos = ${general.buffer_minutos}
pasta_dados = ${JSON.stringify(general.pasta_dados)}
dias_guardar_clipes = ${general.dias_guardar_clipes}
estilo_legenda = ${JSON.stringify(general.estilo_legenda)}
titulo_segundos = ${general.titulo_segundos}
layout_video = ${JSON.stringify(general.layout_video)}
tema_noticia = ${JSON.stringify(general.tema_noticia)}
posicao_noticia = ${JSON.stringify(general.posicao_noticia)}
clipe_inteiro = ${general.clipe_inteiro}

[detector]
janela_segundos = ${detector.janela_segundos}
multiplicador_minimo = ${detector.multiplicador_minimo}
multiplicador_forte = ${detector.multiplicador_forte}
reacao_minima = ${detector.reacao_minima}
chat_grande_msgs_s = ${detector.chat_grande_msgs_s}
chat_grande_multiplicador = ${detector.chat_grande_multiplicador}
chat_grande_reacao = ${detector.chat_grande_reacao}
cooldown_segundos = ${detector.cooldown_segundos}
audio_db_acima = ${detector.audio_db_acima}
audio_sozinho_db = ${detector.audio_sozinho_db}
clipes_janela_segundos = ${detector.clipes_janela_segundos}
clipes_minimo = ${detector.clipes_minimo}
clipes_multiplicador = ${detector.clipes_multiplicador}
intervalo_previas_segundos = ${detector.intervalo_previas_segundos}
min_palavras_previa = ${detector.min_palavras_previa}
pre_roll = ${detector.pre_roll}
post_roll = ${detector.post_roll}

[ia]
nota_minima = ${ai.nota_minima}
enviar_reprovados = ${ai.enviar_reprovados}
aprovacao_manual = ${ai.aprovacao_manual}
limite_analises_hora = ${ai.limite_analises_hora}
orcamento_diario_usd = ${ai.orcamento_diario_usd.toFixed(1)}
min_palavras = ${ai.min_palavras}

# ------------------------------------------------------------
#  Отслеживаемые каналы (${activeChannels.length} активн.)
# ------------------------------------------------------------
${channelBlocks || '# Добавьте хотя бы один активный канал'}
`;
}

export function generateEnvFile(state: PipelineState, includeEnteredValues = false): string {
  const val = (v: string) => (includeEnteredValues ? v.trim() : '');
  const { env, ai } = state;

  return `# Скопируйте в .env и заполните ключи. НЕ добавляйте .env в git!
# --- Обязательные ---
ANTHROPIC_API_KEY=${val(env.anthropicKey)}
TELEGRAM_BOT_TOKEN=${val(env.telegramBotToken)}
TELEGRAM_CHAT_ID=${val(env.telegramChatId)}

# --- Модель Claude: opus-5-5 (~$0.04/клип) или sonnet-5-5 (~$0.02/клип) ---
CLAUDE_MODEL=${ai.model}

# --- Twitch: детектор "дождь клипов" (бесплатно на dev.twitch.tv/console) ---
TWITCH_CLIENT_ID=${val(env.twitchClientId)}
TWITCH_CLIENT_SECRET=${val(env.twitchClientSecret)}

# --- YouTube: чат YouTube-стримеров (YouTube Data API v3, Google Cloud) ---
YOUTUBE_API_KEY=${val(env.youtubeApiKey)}

# --- Прокси (опционально; для Anthropic из РФ нужен VPN или HTTPS_PROXY) ---
${env.httpsProxy.trim() && includeEnteredValues ? `HTTPS_PROXY=${env.httpsProxy.trim()}` : '# HTTPS_PROXY=http://127.0.0.1:7890'}
TELEGRAM_PROXY=${val(env.telegramProxy)}
`;
}

export function generateSetupGuide(state: PipelineState): string {
  const firstTwitch = state.channels.find((c) => c.enabled && c.plataforma === 'twitch');
  const testTarget = firstTwitch ? `twitch:${firstTwitch.canal}:${firstTwitch.idioma}` : 'twitch:caseoh_:en';

  return `# SETUP — ${state.repo.repoName || 'livecut-en'} (гайд на русском)

## 0. Системные требования
- Windows 10/11, постоянно включённый ПК (конвейер пишет буфер 24/7).
- Python 3.11–3.13 (при установке отметить "Add Python to PATH").
- ffmpeg: \`winget install --id Gyan.FFmpeg -e\` (после установки перезапустите терминал).
- NVIDIA GPU желательна (Whisper large-v3-turbo + NVENC). Без GPU код перейдёт на CPU/Whisper small.
- ~20+ ГБ свободного места на диске и стабильный безлимитный интернет.

## 1. Установка
\`\`\`bat
git clone https://github.com/Teodorox/livecut-ai.git ${state.repo.repoName || 'livecut-en'}
cd ${state.repo.repoName || 'livecut-en'}
python apply_en_patch.py
py -3.13 -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
pip install nvidia-cublas-cu12 nvidia-cudnn-cu12   :: только если есть NVIDIA GPU
\`\`\`

## 2. Ключи (.env)
- \`ANTHROPIC_API_KEY\` — console.anthropic.com (из РФ нужен системный VPN или \`HTTPS_PROXY\` в \`.env\`).
- \`TELEGRAM_BOT_TOKEN\` — @BotFather -> /newbot.
- \`TELEGRAM_CHAT_ID\` — напишите боту, затем откройте \`https://api.telegram.org/bot<TOKEN>/getUpdates\`.
- \`TWITCH_CLIENT_ID\` / \`TWITCH_CLIENT_SECRET\` — dev.twitch.tv/console (для «дождя клипов»).
- \`YOUTUBE_API_KEY\` — console.cloud.google.com -> YouTube Data API v3 (для YouTube-чатов).

## 3. Калибровка (2–3 дня)
\`\`\`bat
python -m clipper.main --canal ${testTarget}
python -m clipper.main
\`\`\`
- При \`aprovacao_manual = true\` в Telegram приходят превью с кнопками **Analyze with AI / Discard / Use full segment**.
- Много мусора -> повысьте \`nota_minima\` (6 -> 7) и \`min_msgs\`.
- Мало клипов -> снизьте \`multiplicador_minimo\` (2.5 -> 2.0) или \`min_msgs\`.

## 4. Полный автомат
Установите \`aprovacao_manual = false\` в \`config.toml\`. Бот будет присылать уже готовые нарезки с подписью и хэштегами (${state.hashtags.map((t) => `#${t}`).join(' ')}). Ваша задача: посмотреть -> выложить -> нажать **Posted**.

## 5. Бюджет и команды
- Текущая модель в конфигурации: \`${state.ai.model}\` (дневной лимит $${state.ai.orcamento_diario_usd.toFixed(2)}, до ${state.ai.limite_analises_hora} анализов/час).
- Команды Telegram-боту: \`/status\`, \`/clip <имя>\`, \`/refazer <id>\`, \`/saldo\`, \`/saldo 25.00\`.
`;
}

export function generateReadme(state: PipelineState): string {
  const activeNames = state.channels.filter((c) => c.enabled).map((c) => c.nome).join(' / ') || 'Custom Channels';
  return `# ${state.repo.repoName || 'livecut-en'}

Automated 24/7 livestream-to-short-clip pipeline based on [Teodorox/livecut-ai](https://github.com/Teodorox/livecut-ai).

- **Channels**: ${activeNames}
- **Target format**: ${state.general.layout_video === 'vertical' ? '9:16 Vertical' : '4:5 News Card'} · Subtitle style: \`${state.general.estilo_legenda}\`
- **Fixed tags**: \`[streamer]\`, ${state.hashtags.map((t) => `\`${t}\``).join(', ')}
- **Claude model**: configurable via \`CLAUDE_MODEL\` in \`.env\` (default: \`${state.ai.model}\`)

Russian setup guide: [SETUP_RU.md](SETUP_RU.md).
Check upstream license before making a fork public; keep the repository private if no license is present.
`;
}

export function generatePatchScript(state: PipelineState): string {
  const configToml = generateConfigToml(state);
  const envTemplate = generateEnvFile(state, false);
  const setupRu = generateSetupGuide(state);
  const readme = generateReadme(state);

  const reactionRegexParts = state.extraReactions
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => reactionPart(r));

  const spamRegexParts = state.extraSpamTerms
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => spamTermToRegex(s));

  const tagList = state.hashtags
    .map((t) => t.replace(/[^a-zA-Z0-9а-яА-ЯёЁ]/g, '').toLowerCase())
    .filter(Boolean)
    .slice(0, 4);
  const pythonTags = tagList.map((t) => JSON.stringify(t)).join(', ');

  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
livecut-ai -> ${state.repo.repoName || 'livecut-en'}  |  Generated by LiveCut Studio
Запуск:  python apply_en_patch.py   (из корня клона livecut-ai, Python 3.10+)
Делает бэкапы в _backup_pre_en/, проверяет каждую правку, парсит AST/TOML и пишет PATCH_REPORT.txt.
Повторный запуск безопасен (уже применённые изменения пропускаются).
"""
import ast
import pathlib
import re
import shutil
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = pathlib.Path(__file__).resolve().parent
BACKUP = ROOT / "_backup_pre_en"
RESULTS, CRIT_FAIL = [], 0


def record(status, rel, label, critical):
    global CRIT_FAIL
    RESULTS.append((status, rel, label, critical))
    if status == "FAIL" and critical:
        CRIT_FAIL += 1
    print(f"[{status:4}] {rel}: {label}")


def backup(rel):
    src, dst = ROOT / rel, BACKUP / rel
    if src.exists() and not dst.exists():
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)


def patch(rel, old, new, label, critical=True, regex=False):
    p = ROOT / rel
    if not p.exists():
        record("FAIL", rel, label + " (нет файла)", critical)
        return
    src = p.read_text(encoding="utf-8")
    if regex:
        if re.search(old, src, re.DOTALL):
            out = re.sub(old, lambda _m: new, src, count=1, flags=re.DOTALL)
        elif new in src:
            record("SKIP", rel, label + " (уже применено)", critical)
            return
        else:
            record("FAIL", rel, label, critical)
            return
    else:
        if old in src:
            out = src.replace(old, new)
        elif new in src:
            record("SKIP", rel, label + " (уже применено)", critical)
            return
        else:
            record("FAIL", rel, label, critical)
            return
    backup(rel)
    p.write_text(out, encoding="utf-8")
    if rel.endswith(".py"):
        try:
            ast.parse(out)
        except SyntaxError as exc:
            shutil.copy2(BACKUP / rel, p)
            record("FAIL", rel, label + f" (СИНТАКСИС, откачено: {exc})", True)
            return
    record("OK", rel, label, critical)


def write_new(rel, content, label, overwrite=False):
    if rel.endswith(".toml"):
        try:
            import tomllib
            try:
                tomllib.loads(content)
            except Exception as exc:
                record("FAIL", rel, label + f" (невалидный TOML: {exc})", True)
                return
        except ModuleNotFoundError:
            pass
    p = ROOT / rel
    if p.exists() and not overwrite:
        alt = p.with_name(p.stem + ".en" + p.suffix)
        alt.write_text(content, encoding="utf-8")
        record("SKIP", rel, label + f" (существует -> записан {alt.name})", False)
        return
    backup(rel)
    p.write_text(content, encoding="utf-8")
    record("OK", rel, label, True)


if not (ROOT / "clipper" / "main.py").exists():
    sys.exit("Запусти меня из корня клона livecut-ai (рядом должна быть папка clipper/).")

# ============================================================ 1. CURATOR
SYSTEM_PROMPT = """${safeDoubleTriple(state.systemPrompt)}
"""

patch(
    "clipper/curator.py",
    r'SYSTEM = """.*?"""',
    'SYSTEM = """' + SYSTEM_PROMPT + '"""',
    "SYSTEM prompt -> customized",
    critical=True,
    regex=True,
)
patch(
    "clipper/curator.py",
    "import json\\nimport logging\\nimport re",
    "import json\\nimport logging\\nimport os\\nimport re",
    "import os",
    critical=True,
)
patch(
    "clipper/curator.py",
    'MODEL = "claude-opus-5-5"',
    'MODEL = os.getenv("CLAUDE_MODEL", "").strip() or "${state.ai.model}"',
    "CLAUDE_MODEL из .env",
    critical=True,
)
patch(
    "clipper/curator.py",
    '    lang = "inglês" if m.channel.language == "en" else "português"',
    '    lang = {"en": "English", "ru": "Russian"}.get(m.channel.language, "Portuguese")',
    "language mapping (en/ru/pt)",
    critical=True,
)

for old, new, lbl in [
    ('"(sem fala detectada)"', '"(no speech detected)"', "no-speech"),
    ('"(sem mensagens)"', '"(no messages)"', "no-messages"),
    ('f"(sem IA: {why})"', 'f"(no AI: {why})"', "fallback reason"),
    ('f"{m.channel.name} no GTA 6"', 'f"{m.channel.name} in GTA 6"', "fallback caption"),
    ('"limite de uso da API"', '"API rate limit"', "rate limit msg"),
    ('f"erro da API {e.status_code}"', 'f"API error {e.status_code}"', "api error msg"),
    ('"sem conexão com a API"', '"no API connection"', "connection msg"),
    ('"IA recusou o conteúdo"', '"AI refused the content"', "refusal msg"),
    ('"resposta inválida"', '"invalid response"', "invalid json msg"),
]:
    patch("clipper/curator.py", old, new, lbl, critical=False)

# ============================================================ 2. DETECTOR
${reactionRegexParts.length > 0 ? `patch(
    "clipper/detector.py",
    r'r"\\bdeadge\\b", r"\\bbruh\\b", ',
    r'r"\\bdeadge\\b", r"\\bbruh\\b", ${reactionRegexParts.join(', ')}, ',
    "реакции чата (+${reactionRegexParts.length})",
    critical=True,
)` : '# Дополнительные реакции чата не указаны'}

${spamRegexParts.length > 0 ? `patch(
    "clipper/detector.py",
    r'|link na bio|inscrev|\\bresgat",',
    r'|link na bio|inscrev|\\bresgat|${spamRegexParts.join('|')}",',
    "фильтр спама и розыгрышей",
    critical=True,
)` : '# Дополнительные спам-слова не указаны'}

# ============================================================ 3. MAIN
patch(
    "clipper/main.py",
    '    return ["".join(c for c in streamer.lower() if c.isalnum()), "gta", "gta6", "fyp", "foryou"]',
    '    return ["".join(c for c in streamer.lower() if c.isalnum()), ${pythonTags || '"gta6", "gta", "fyp", "shorts"'}]',
    "fixed_tags -> ${tagList.join(', ')}",
    critical=True,
)
${spamRegexParts.length > 0 ? `patch(
    "clipper/main.py",
    r'    r"patrocin|publi\\b|\\bpix\\b|se inscrev|inscreva|resgat|digit(?:a|em|e) (?:no|aí no) chat",',
    r'    r"patrocin|publi\\b|\\bpix\\b|se inscrev|inscreva|resgat|digit(?:a|em|e) (?:no|aí no) chat|"' + "\\n"
    r'    r"${spamRegexParts.join('|')}",',
    "фильтр рекламной речи",
    critical=True,
)` : ''}
patch(
    "clipper/main.py",
    r'await self.tg.send_text(f"🤖 <b>Clipador ligado</b>\\nMonitorando: {names}\\nComandos: /status /clip /saldo /ajuda")',
    r'await self.tg.send_text(f"🤖 <b>Clipper online</b>\\nMonitoring: {names}\\nCommands: /status /clip /saldo /ajuda")',
    "startup -> EN",
    critical=False,
)
patch(
    "clipper/main.py",
    r'f"<i>Analisar custa ~US\\$ 0,04\\. Descartar não gasta nada\\.</i>"',
    r'f"<i>Analyzing costs ~$0.04. Discarding is free.</i>"',
    "preview cost -> EN",
    critical=False,
    regex=True,
)

# ============================================================ 4. TELEGRAM & RENDER
for old, new, lbl in [
    ('"✅ Analisar com IA"', '"✅ Analyze with AI"', "button analyze"),
    ('"🗑 Descartar"', '"🗑 Discard"', "button discard"),
    ('"🎬 Usar o trecho inteiro (IA só legenda)"', '"🎬 Use full segment (AI subtitles only)"', "button full"),
    ('"✅ Postei"', '"✅ Posted"', "button posted"),
    ('"📷 Câmera errada"', '"📷 Wrong camera"', "button camera"),
    (r'"⚠️ <b>REPROVADO PELA IA</b>\\n"', r'"⚠️ <b>REJECTED BY AI</b>\\n"', "rejected label"),
    ('nota <b>{score}/10</b>', 'score <b>{score}/10</b>', "score label"),
    ("' (sem IA)'", "' (no AI)'", "no-AI label"),
    ('📋 <b>Legenda pro TikTok</b> (toque para copiar):', '📋 <b>Caption for TikTok / Shorts</b> (tap to copy):', "caption label"),
]:
    patch("clipper/telegram.py", old, new, lbl, critical=False)

patch("clipper/render.py", 'f"{ch.name} no GTA 6"', 'f"{ch.name} in GTA 6"', "headline fallback EN", critical=False)

# ============================================================ 5. CONFIG, ENV & DOCS
CONFIG = '''${safeTriple(configToml)}'''
write_new("config.toml", CONFIG, "config.toml")

ENV_TEMPLATE = '''${safeTriple(envTemplate)}'''
if not (ROOT / ".env").exists():
    write_new(".env", ENV_TEMPLATE, ".env шаблон")
else:
    write_new(".env.example", ENV_TEMPLATE, ".env существует -> обновлён .env.example", overwrite=True)

README = '''${safeTriple(readme)}'''
write_new("README.md", README, "README.md", overwrite=True)

SETUP = '''${safeTriple(setupRu)}'''
write_new("SETUP_RU.md", SETUP, "SETUP_RU.md", overwrite=True)

gi = ROOT / ".gitignore"
cur = gi.read_text(encoding="utf-8") if gi.exists() else ""
need = [".env", "config.toml", "data/", "_backup_pre_en/", "PATCH_REPORT.txt", ".venv/"]
add = [x for x in need if x not in cur.splitlines()]
if add:
    backup(".gitignore")
    gi.write_text(cur + ("\\n" if cur and not cur.endswith("\\n") else "") + "\\n".join(add) + "\\n", encoding="utf-8")
    record("OK", ".gitignore", "добавлено: " + ", ".join(add), True)

lines = [f"{s} | {f} | {l} | {'CRITICAL' if c else 'cosmetic'}" for s, f, l, c in RESULTS]
(ROOT / "PATCH_REPORT.txt").write_text("\\n".join(lines) + f"\\n\\nCRITICAL FAILURES: {CRIT_FAIL}\\n", encoding="utf-8")
ok = sum(1 for s, *_ in RESULTS if s == "OK")
skip = sum(1 for s, *_ in RESULTS if s == "SKIP")
fail = sum(1 for s, *_ in RESULTS if s == "FAIL")
print(f"\\n===== ИТОГ: OK={ok}  SKIP={skip}  FAIL={fail}  (critical fail: {CRIT_FAIL}) =====")
if CRIT_FAIL:
    print("Есть критические несовпадения с upstream. Проверьте PATCH_REPORT.txt.")
    sys.exit(1)
print("Готово! Заполните .env и запускайте: python -m clipper.main")
`;
}
