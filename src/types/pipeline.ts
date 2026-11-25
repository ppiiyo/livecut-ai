export type Platform = 'twitch' | 'youtube' | 'kick';
export type ChannelLayout = 'auto' | 'fundo' | 'facecam';
export type DetectionMode = 'chat' | 'audio' | 'ambos';
export type VideoLayout = 'vertical' | 'noticia';
export type SubtitleStyle = 'karaoke' | 'neon' | 'classico' | 'por_do_sol' | 'faixa' | 'hq';
export type PresetId = 'en-gta6' | 'ru-gta6' | 'en-gaming';
export type ClaudeModelId = 'claude-opus-5-5' | 'claude-sonnet-5-5';
export type ViewId = 'pipeline' | 'simulator' | 'setup' | 'export';

export interface ChannelConfig {
  id: string;
  nome: string;
  plataforma: Platform;
  canal: string;
  idioma: 'en' | 'ru' | 'pt';
  layout: ChannelLayout;
  facecam?: [number, number, number, number];
  deteccao: DetectionMode;
  min_msgs: number;
  enabled: boolean;
  notes?: string;
}

export interface GeneralConfig {
  perfil_tiktok: string;
  qualidade: string;
  buffer_minutos: number;
  pasta_dados: string;
  dias_guardar_clipes: number;
  estilo_legenda: SubtitleStyle;
  titulo_segundos: number;
  layout_video: VideoLayout;
  tema_noticia: string;
  posicao_noticia: 'cima' | 'baixo';
  clipe_inteiro: boolean;
}

export interface DetectorConfig {
  janela_segundos: number;
  multiplicador_minimo: number;
  multiplicador_forte: number;
  reacao_minima: number;
  chat_grande_msgs_s: number;
  chat_grande_multiplicador: number;
  chat_grande_reacao: number;
  cooldown_segundos: number;
  audio_db_acima: number;
  audio_sozinho_db: number;
  clipes_janela_segundos: number;
  clipes_minimo: number;
  clipes_multiplicador: number;
  intervalo_previas_segundos: number;
  min_palavras_previa: number;
  pre_roll: number;
  post_roll: number;
}

export interface AiConfig {
  nota_minima: number;
  enviar_reprovados: boolean;
  aprovacao_manual: boolean;
  limite_analises_hora: number;
  orcamento_diario_usd: number;
  min_palavras: number;
  model: ClaudeModelId;
  estimatedClipsPerDay: number;
}

export interface EnvConfig {
  anthropicKey: string;
  telegramBotToken: string;
  telegramChatId: string;
  twitchClientId: string;
  twitchClientSecret: string;
  youtubeApiKey: string;
  httpsProxy: string;
  telegramProxy: string;
}

export interface RepoSettings {
  githubUser: string;
  repoName: string;
  targetPlatforms: {
    tiktok: boolean;
    youtubeShorts: boolean;
    reels: boolean;
  };
}

export interface PipelineState {
  presetId: PresetId;
  general: GeneralConfig;
  detector: DetectorConfig;
  ai: AiConfig;
  channels: ChannelConfig[];
  systemPrompt: string;
  hashtags: string[];
  extraReactions: string[];
  extraSpamTerms: string[];
  env: EnvConfig;
  repo: RepoSettings;
  completedChecklistIds: string[];
}

export type ClipStage = 'preview' | 'analyzed' | 'posted' | 'discarded' | 'camera_flagged';

export interface SimulatedClip {
  id: string;
  clipNumber: number;
  streamer: string;
  platform: Platform;
  channelLayout: ChannelLayout;
  triggerLabel: string;
  durationSec: number;
  score: number;
  hook: string;
  headline: string;
  caption: string;
  subtitleSample: string[];
  transcriptSnippet: string;
  stage: ClipStage;
  detectedAt: string;
}
