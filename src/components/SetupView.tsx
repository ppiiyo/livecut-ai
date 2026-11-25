import { useState } from 'react';
import { Copy, Check, ShieldAlert } from 'lucide-react';
import { PipelineState } from '../types/pipeline';
import { SETUP_CHECKLIST } from '../data/presets';
import { validateGithubUser, validateRepoName } from '../utils/validation';

interface SetupViewProps {
  state: PipelineState;
  onUpdateEnv: <K extends keyof PipelineState['env']>(key: K, value: string) => void;
  onUpdateRepo: <K extends keyof PipelineState['repo']>(key: K, value: PipelineState['repo'][K]) => void;
  onToggleChecklist: (stepId: string) => void;
}

export function SetupView({ state, onUpdateEnv, onUpdateRepo, onToggleChecklist }: SetupViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const ghUserError = validateGithubUser(state.repo.githubUser);
  const repoNameError = validateRepoName(state.repo.repoName);

  const copyCommand = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopiedId(null);
    }
  };

  const gitPushCommands = `git remote rename origin upstream
git remote add origin https://github.com/${state.repo.githubUser || 'ppiiyo'}/${state.repo.repoName || 'livecut-en'}.git
git add -A
git commit -m "Configured livecut pipeline"
git push -u origin main`;

  return (
    <div className="space-y-8">
      {/* 1. .env локальный конструктор */}
      <section aria-labelledby="env-heading" className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 id="env-heading" className="text-base font-semibold text-slate-900">
              01. Переменные окружения (.env)
            </h2>
            <p className="text-sm text-slate-500">
              Поля необязательны: вы можете оставить их пустыми для шаблона .env.example или заполнить для локальной выгрузки.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 shrink-0">
            <ShieldAlert className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span>Ключи хранятся только в памяти вкладки и не сохраняются между сессиями</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="env-anthropic" className="block text-xs font-medium text-slate-700 mb-1.5">
              ANTHROPIC_API_KEY (обязательно)
            </label>
            <input
              id="env-anthropic"
              type="password"
              autoComplete="off"
              placeholder="sk-ant-api03-..."
              value={state.env.anthropicKey}
              onChange={(e) => onUpdateEnv('anthropicKey', e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="env-tg-token" className="block text-xs font-medium text-slate-700 mb-1.5">
              TELEGRAM_BOT_TOKEN (через @BotFather)
            </label>
            <input
              id="env-tg-token"
              type="password"
              autoComplete="off"
              placeholder="123456:ABC-DEF..."
              value={state.env.telegramBotToken}
              onChange={(e) => onUpdateEnv('telegramBotToken', e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="env-tg-chat" className="block text-xs font-medium text-slate-700 mb-1.5">
              TELEGRAM_CHAT_ID
            </label>
            <input
              id="env-tg-chat"
              type="text"
              placeholder="-1001234567890"
              value={state.env.telegramChatId}
              onChange={(e) => onUpdateEnv('telegramChatId', e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="env-twitch-id" className="block text-xs font-medium text-slate-700 mb-1.5">
              TWITCH_CLIENT_ID (для «дождя клипов»)
            </label>
            <input
              id="env-twitch-id"
              type="text"
              placeholder="опционально"
              value={state.env.twitchClientId}
              onChange={(e) => onUpdateEnv('twitchClientId', e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="env-twitch-secret" className="block text-xs font-medium text-slate-700 mb-1.5">
              TWITCH_CLIENT_SECRET
            </label>
            <input
              id="env-twitch-secret"
              type="password"
              autoComplete="off"
              placeholder="опционально"
              value={state.env.twitchClientSecret}
              onChange={(e) => onUpdateEnv('twitchClientSecret', e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="env-yt-key" className="block text-xs font-medium text-slate-700 mb-1.5">
              YOUTUBE_API_KEY (для чата IShowSpeed)
            </label>
            <input
              id="env-yt-key"
              type="password"
              autoComplete="off"
              placeholder="AIzaSy..."
              value={state.env.youtubeApiKey}
              onChange={(e) => onUpdateEnv('youtubeApiKey', e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="env-https-proxy" className="block text-xs font-medium text-slate-700 mb-1.5">
              HTTPS_PROXY (если Anthropic заблокирован)
            </label>
            <input
              id="env-https-proxy"
              type="text"
              placeholder="http://127.0.0.1:7890"
              value={state.env.httpsProxy}
              onChange={(e) => onUpdateEnv('httpsProxy', e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label htmlFor="env-tg-proxy" className="block text-xs font-medium text-slate-700 mb-1.5">
              TELEGRAM_PROXY
            </label>
            <input
              id="env-tg-proxy"
              type="text"
              placeholder="socks5://127.0.0.1:1080"
              value={state.env.telegramProxy}
              onChange={(e) => onUpdateEnv('telegramProxy', e.target.value)}
              className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-200 rounded-lg"
            />
          </div>
        </div>
      </section>

      {/* 2. GitHub форк и чек-лист запуска */}
      <section aria-labelledby="checklist-heading" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="checklist-heading" className="text-base font-semibold text-slate-900">
              02. Чек-лист запуска на Windows
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-500">
              {state.completedChecklistIds.length} / {SETUP_CHECKLIST.length} выполнено
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {SETUP_CHECKLIST.map((step) => {
              const checked = state.completedChecklistIds.includes(step.id);
              return (
                <div key={step.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleChecklist(step.id)}
                      className="mt-0.5 w-4 h-4 accent-blue-600 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-500">{step.phase}</div>
                      <div className={`text-sm font-medium ${checked ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {step.title}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">{step.detail}</p>
                    </div>
                  </label>
                  {step.command && (
                    <div className="ml-7 flex items-center justify-between gap-2 bg-slate-50 rounded-md px-3 py-2">
                      <code className="text-xs font-mono text-slate-800 overflow-x-auto whitespace-nowrap">
                        {step.command}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyCommand(step.id, step.command!)}
                        aria-label={`Копировать команду для шага ${step.title}`}
                        className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                      >
                        {copiedId === step.id ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                        {copiedId === step.id ? 'Скопировано' : 'Копировать'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <h3 className="text-base font-semibold text-slate-900">03. Публикация в свой GitHub</h3>
          <p className="text-xs text-slate-500">
            Проверьте лицензию upstream-репозитория перед тем, как делать ваш форк публичным.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="gh-user" className="block text-xs font-medium text-slate-700 mb-1">
                GitHub логин
              </label>
              <input
                id="gh-user"
                type="text"
                value={state.repo.githubUser}
                onChange={(e) => onUpdateRepo('githubUser', e.target.value)}
                className={`w-full h-9 px-3 text-sm font-mono bg-white border rounded-md ${
                  ghUserError ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {ghUserError && <p className="mt-1 text-xs text-red-600">{ghUserError}</p>}
            </div>
            <div>
              <label htmlFor="gh-repo" className="block text-xs font-medium text-slate-700 mb-1">
                Имя репозитория
              </label>
              <input
                id="gh-repo"
                type="text"
                value={state.repo.repoName}
                onChange={(e) => onUpdateRepo('repoName', e.target.value)}
                className={`w-full h-9 px-3 text-sm font-mono bg-white border rounded-md ${
                  repoNameError ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {repoNameError && <p className="mt-1 text-xs text-red-600">{repoNameError}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">Команды Git для переноса в свой репозиторий</span>
              <button
                type="button"
                onClick={() => copyCommand('git-push', gitPushCommands)}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                {copiedId === 'git-push' ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copiedId === 'git-push' ? 'Скопировано' : 'Копировать'}
              </button>
            </div>
            <pre className="p-3 bg-slate-950 text-slate-100 rounded-md text-xs font-mono overflow-x-auto leading-relaxed">
              {gitPushCommands}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
