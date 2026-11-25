import { PipelineState, Platform } from '../types/pipeline';

const TWITCH_KICK_SLUG_RE = /^[a-zA-Z0-9_]{3,25}$/;
const YOUTUBE_CHANNEL_RE = /^@?[a-zA-Z0-9._-]{3,30}$/;
const TIKTOK_HANDLE_RE = /^@?[a-zA-Z0-9._]{1,30}$/;
const GITHUB_USER_RE = /^[a-zA-Z0-9-]{1,39}$/;
const GITHUB_REPO_RE = /^[a-zA-Z0-9._-]{1,100}$/;

export function validateChannelSlug(platform: Platform, slug: string): string | null {
  const trimmed = slug.trim();
  if (!trimmed) {
    return 'Укажите канал / @handle стримера.';
  }
  if (platform === 'youtube') {
    if (!YOUTUBE_CHANNEL_RE.test(trimmed)) {
      return 'Для YouTube допустимы 3–30 символов: латиница, цифры, ., _, - и опциональный @ в начале.';
    }
    return null;
  }
  if (!TWITCH_KICK_SLUG_RE.test(trimmed)) {
    return `Для ${platform} допустимы 3–25 символов: только латиница, цифры и _ (без @ и пробелов).`;
  }
  return null;
}

export function validateTiktokProfile(handle: string): string | null {
  const trimmed = handle.trim();
  if (!TIKTOK_HANDLE_RE.test(trimmed)) {
    return 'Профиль TikTok: 1–30 символов (латиница, цифры, ., _, опциональный @ в начале).';
  }
  return null;
}

export function validateGithubUser(user: string): string | null {
  const trimmed = user.trim();
  if (!GITHUB_USER_RE.test(trimmed)) {
    return 'GitHub логин: 1–39 символов (латиница, цифры, дефис).';
  }
  return null;
}

export function validateRepoName(repo: string): string | null {
  const trimmed = repo.trim();
  if (!GITHUB_REPO_RE.test(trimmed)) {
    return 'Имя репозитория: 1–100 символов (латиница, цифры, ., _, -).';
  }
  return null;
}

export interface ExportValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePipelineForExport(state: PipelineState): ExportValidationResult {
  const errors: string[] = [];

  const tiktokErr = validateTiktokProfile(state.general.perfil_tiktok);
  if (tiktokErr) errors.push(tiktokErr);

  const ghUserErr = validateGithubUser(state.repo.githubUser);
  if (ghUserErr) errors.push(ghUserErr);

  const repoErr = validateRepoName(state.repo.repoName);
  if (repoErr) errors.push(repoErr);

  for (const ch of state.channels) {
    if (!ch.enabled) continue;
    const chErr = validateChannelSlug(ch.plataforma, ch.canal);
    if (chErr) {
      errors.push(`Канал «${ch.nome || ch.canal}»: ${chErr}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
