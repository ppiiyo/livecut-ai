import { DEFAULT_STATE } from '../data/presets';
import {
  ChannelConfig,
  ChannelLayout,
  ClaudeModelId,
  DetectionMode,
  PipelineState,
  Platform,
  PresetId,
  SubtitleStyle,
  VideoLayout
} from '../types/pipeline';

export const STORAGE_KEY = 'livecut-studio-v2';

const VALID_PRESETS = new Set<PresetId>(['en-gta6', 'ru-gta6', 'en-gaming']);
const VALID_PLATFORMS = new Set<Platform>(['twitch', 'youtube', 'kick']);
const VALID_LANGUAGES = new Set<'en' | 'ru' | 'pt'>(['en', 'ru', 'pt']);
const VALID_LAYOUTS = new Set<ChannelLayout>(['auto', 'fundo', 'facecam']);
const VALID_DETECTIONS = new Set<DetectionMode>(['chat', 'audio', 'ambos']);
const VALID_VIDEO_LAYOUTS = new Set<VideoLayout>(['vertical', 'noticia']);
const VALID_SUBTITLES = new Set<SubtitleStyle>(['karaoke', 'neon', 'classico', 'por_do_sol', 'faixa', 'hq']);
const VALID_MODELS = new Set<ClaudeModelId>(['claude-opus-5-5', 'claude-sonnet-5-5']);

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function isStringArray(val: unknown): val is string[] {
  return Array.isArray(val) && val.every((item) => typeof item === 'string');
}

function isFiniteNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val);
}

function isValidFacecam(val: unknown): val is [number, number, number, number] {
  return (
    Array.isArray(val) &&
    val.length === 4 &&
    val.every((n) => isFiniteNumber(n) && n >= 0 && n <= 1)
  );
}

function parseChannel(raw: unknown): ChannelConfig | null {
  if (!isPlainObject(raw)) return null;
  if (
    typeof raw['id'] !== 'string' ||
    typeof raw['nome'] !== 'string' ||
    typeof raw['canal'] !== 'string' ||
    typeof raw['enabled'] !== 'boolean' ||
    !isFiniteNumber(raw['min_msgs'])
  ) {
    return null;
  }

  const plataforma = raw['plataforma'];
  const idioma = raw['idioma'];
  const layout = raw['layout'];
  const deteccao = raw['deteccao'];

  if (
    typeof plataforma !== 'string' ||
    !VALID_PLATFORMS.has(plataforma as Platform) ||
    typeof idioma !== 'string' ||
    !VALID_LANGUAGES.has(idioma as 'en' | 'ru' | 'pt') ||
    typeof layout !== 'string' ||
    !VALID_LAYOUTS.has(layout as ChannelLayout) ||
    typeof deteccao !== 'string' ||
    !VALID_DETECTIONS.has(deteccao as DetectionMode)
  ) {
    return null;
  }

  const facecamRaw = raw['facecam'];
  if (facecamRaw !== undefined && !isValidFacecam(facecamRaw)) {
    return null;
  }

  const notesRaw = raw['notes'];
  if (notesRaw !== undefined && typeof notesRaw !== 'string') {
    return null;
  }

  return {
    id: raw['id'],
    nome: raw['nome'],
    plataforma: plataforma as Platform,
    canal: raw['canal'],
    idioma: idioma as 'en' | 'ru' | 'pt',
    layout: layout as ChannelLayout,
    facecam: facecamRaw,
    deteccao: deteccao as DetectionMode,
    min_msgs: raw['min_msgs'],
    enabled: raw['enabled'],
    notes: notesRaw
  };
}

export function parseStoredPipelineState(rawJson: string): PipelineState {
  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (!isPlainObject(parsed)) return DEFAULT_STATE;

    const presetId = parsed['presetId'];
    if (typeof presetId !== 'string' || !VALID_PRESETS.has(presetId as PresetId)) {
      return DEFAULT_STATE;
    }

    const generalRaw = parsed['general'];
    const detectorRaw = parsed['detector'];
    const aiRaw = parsed['ai'];
    const repoRaw = parsed['repo'];
    const channelsRaw = parsed['channels'];

    if (
      !isPlainObject(generalRaw) ||
      !isPlainObject(detectorRaw) ||
      !isPlainObject(aiRaw) ||
      !isPlainObject(repoRaw) ||
      !Array.isArray(channelsRaw)
    ) {
      return DEFAULT_STATE;
    }

    if (
      typeof generalRaw['perfil_tiktok'] !== 'string' ||
      typeof generalRaw['layout_video'] !== 'string' ||
      !VALID_VIDEO_LAYOUTS.has(generalRaw['layout_video'] as VideoLayout) ||
      typeof generalRaw['estilo_legenda'] !== 'string' ||
      !VALID_SUBTITLES.has(generalRaw['estilo_legenda'] as SubtitleStyle)
    ) {
      return DEFAULT_STATE;
    }

    if (
      !isFiniteNumber(detectorRaw['multiplicador_minimo']) ||
      !isFiniteNumber(detectorRaw['cooldown_segundos'])
    ) {
      return DEFAULT_STATE;
    }

    if (
      !isFiniteNumber(aiRaw['nota_minima']) ||
      typeof aiRaw['aprovacao_manual'] !== 'boolean' ||
      typeof aiRaw['enviar_reprovados'] !== 'boolean' ||
      !isFiniteNumber(aiRaw['orcamento_diario_usd']) ||
      !isFiniteNumber(aiRaw['estimatedClipsPerDay']) ||
      typeof aiRaw['model'] !== 'string' ||
      !VALID_MODELS.has(aiRaw['model'] as ClaudeModelId)
    ) {
      return DEFAULT_STATE;
    }

    if (
      typeof repoRaw['githubUser'] !== 'string' ||
      typeof repoRaw['repoName'] !== 'string' ||
      !isPlainObject(repoRaw['targetPlatforms'])
    ) {
      return DEFAULT_STATE;
    }

    const parsedChannels: ChannelConfig[] = [];
    for (const item of channelsRaw) {
      const ch = parseChannel(item);
      if (!ch) return DEFAULT_STATE;
      parsedChannels.push(ch);
    }

    if (
      typeof parsed['systemPrompt'] !== 'string' ||
      !isStringArray(parsed['hashtags']) ||
      !isStringArray(parsed['extraReactions']) ||
      !isStringArray(parsed['extraSpamTerms']) ||
      !isStringArray(parsed['completedChecklistIds'])
    ) {
      return DEFAULT_STATE;
    }

    return {
      presetId: presetId as PresetId,
      general: {
        ...DEFAULT_STATE.general,
        ...generalRaw,
        layout_video: generalRaw['layout_video'] as VideoLayout,
        estilo_legenda: generalRaw['estilo_legenda'] as SubtitleStyle
      },
      detector: {
        ...DEFAULT_STATE.detector,
        ...detectorRaw
      },
      ai: {
        ...DEFAULT_STATE.ai,
        ...aiRaw,
        model: aiRaw['model'] as ClaudeModelId
      },
      channels: parsedChannels,
      systemPrompt: parsed['systemPrompt'],
      hashtags: parsed['hashtags'],
      extraReactions: parsed['extraReactions'],
      extraSpamTerms: parsed['extraSpamTerms'],
      env: { ...DEFAULT_STATE.env },
      repo: {
        ...DEFAULT_STATE.repo,
        ...repoRaw,
        targetPlatforms: {
          ...DEFAULT_STATE.repo.targetPlatforms,
          ...(repoRaw['targetPlatforms'] as Record<string, boolean>)
        }
      },
      completedChecklistIds: parsed['completedChecklistIds']
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function serializeStateWithoutSecrets(state: PipelineState): string {
  const { env: _omittedSecrets, ...safeState } = state;
  return JSON.stringify(safeState);
}
