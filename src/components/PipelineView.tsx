import { Fragment, useEffect, useState } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
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
import { PRESET_METADATA } from '../data/presets';
import { estimateMonthlyCost } from '../utils/generator';
import { validateChannelSlug, validateTiktokProfile } from '../utils/validation';

interface PipelineViewProps {
  state: PipelineState;
  onApplyPreset: (presetId: PresetId) => void;
  onUpdateGeneral: <K extends keyof PipelineState['general']>(key: K, value: PipelineState['general'][K]) => void;
  onUpdateDetector: <K extends keyof PipelineState['detector']>(key: K, value: PipelineState['detector'][K]) => void;
  onUpdateAi: <K extends keyof PipelineState['ai']>(key: K, value: PipelineState['ai'][K]) => void;
  onAddChannel: (channel: Omit<ChannelConfig, 'id'>) => void;
  onToggleChannel: (id: string) => void;
  onUpdateChannelField: <K extends keyof ChannelConfig>(id: string, key: K, value: ChannelConfig[K]) => void;
  onRemoveChannel: (id: string) => void;
  onUpdateSystemPrompt: (prompt: string) => void;
  onUpdateHashtags: (tags: string[]) => void;
}

const DEFAULT_FACECAM: [number, number, number, number] = [0.02, 0.65, 0.25, 0.3];

export function PipelineView({
  state,
  onApplyPreset,
  onUpdateGeneral,
  onUpdateDetector,
  onUpdateAi,
  onAddChannel,
  onToggleChannel,
  onUpdateChannelField,
  onRemoveChannel,
  onUpdateSystemPrompt,
  onUpdateHashtags
}: PipelineViewProps) {
  const [newName, setNewName] = useState('');
  const [newPlatform, setNewPlatform] = useState<Platform>('twitch');
  const [newHandle, setNewHandle] = useState('');
  const [newLanguage, setNewLanguage] = useState<'en' | 'ru' | 'pt'>(state.presetId === 'ru-gta6' ? 'ru' : 'en');
  const [newLayout, setNewLayout] = useState<ChannelLayout>('auto');
  const [newDetection, setNewDetection] = useState<DetectionMode>('ambos');
  const [newMinMsgs, setNewMinMsgs] = useState(30);
  const [channelError, setChannelError] = useState('');
  const [tagDraft, setTagDraft] = useState(state.hashtags.join(', '));

  useEffect(() => {
    setTagDraft(state.hashtags.join(', '));
  }, [state.hashtags]);

  useEffect(() => {
    setNewLanguage(state.presetId === 'ru-gta6' ? 'ru' : 'en');
  }, [state.presetId]);

  const cost = estimateMonthlyCost(
    state.ai.estimatedClipsPerDay,
    state.ai.model,
    state.ai.orcamento_diario_usd,
    state.ai.aprovacao_manual
  );

  const hasRuChannelWithNoticia =
    state.general.layout_video === 'noticia' && state.channels.some((c) => c.enabled && c.idioma === 'ru');

  const liveSlugError = newHandle.trim() ? validateChannelSlug(newPlatform, newHandle) : null;
  const tiktokError = validateTiktokProfile(state.general.perfil_tiktok);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newName.trim();
    const cleanHandle = newHandle.trim();
    if (!cleanName) {
      setChannelError('Укажите отображаемое имя стримера.');
      return;
    }
    const slugErr = validateChannelSlug(newPlatform, cleanHandle);
    if (slugErr) {
      setChannelError(slugErr);
      return;
    }
    setChannelError('');
    onAddChannel({
      nome: cleanName,
      plataforma: newPlatform,
      canal: cleanHandle,
      idioma: newLanguage,
      layout: newLayout,
      deteccao: newDetection,
      min_msgs: Math.max(5, Number(newMinMsgs) || 30),
      enabled: true
    });
    setNewName('');
    setNewHandle('');
  };

  const updateFacecamCoord = (ch: ChannelConfig, index: 0 | 1 | 2 | 3, value: number) => {
    const base: [number, number, number, number] = ch.facecam ? [...ch.facecam] : [...DEFAULT_FACECAM];
    const clamped = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
    base[index] = clamped;
    onUpdateChannelField(ch.id, 'facecam', base);
  };

  return (
    <div className="space-y-8">
      {/* 1. Пресет ниши */}
      <section aria-labelledby="preset-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 id="preset-heading" className="text-base font-semibold text-slate-900">
              01. Ниша и стартовый пресет
            </h2>
            <p className="text-sm text-slate-500">
              Переключение пресета сразу настраивает каналы, системный промпт куратора и словарь реакций.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(PRESET_METADATA) as PresetId[]).map((id) => {
            const meta = PRESET_METADATA[id];
            const active = state.presetId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onApplyPreset(id)}
                className={`p-4 text-left rounded-lg border transition-colors ${
                  active
                    ? 'bg-white border-blue-600 ring-1 ring-blue-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-semibold text-slate-900">{meta.label}</div>
                <div className="mt-1 text-xs text-slate-500 leading-relaxed">{meta.subtitle}</div>
              </button>
            );
          })}
        </div>

        {hasRuChannelWithNoticia && (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" aria-hidden="true" />
            <div>
              Для русскоязычных каналов в макете <span className="font-mono">4:5 noticia</span> шрифты Anton и Archivo Black не содержат кириллицы. Переключите формат на <span className="font-mono">vertical (9:16)</span> или замените шрифты в <span className="font-mono">card.py</span>.
            </div>
          </div>
        )}
      </section>

      {/* 2. Автоматизация и бюджет */}
      <section aria-labelledby="automation-heading" className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 id="automation-heading" className="text-base font-semibold text-slate-900">
              02. Режим автопилота и лимиты Claude
            </h2>
            <p className="text-sm text-slate-500">
              Первые 2–3 дня рекомендуется калибровка с ручным подтверждением в Telegram, затем полный автомат.
            </p>
          </div>
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => onUpdateAi('aprovacao_manual', true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                state.ai.aprovacao_manual ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ручная калибровка
            </button>
            <button
              type="button"
              onClick={() => onUpdateAi('aprovacao_manual', false)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                !state.ai.aprovacao_manual ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Полный автомат
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label htmlFor="claude-model" className="block text-xs font-medium text-slate-700 mb-1.5">
              Модель Claude (CLAUDE_MODEL)
            </label>
            <select
              id="claude-model"
              value={state.ai.model}
              onChange={(e) => onUpdateAi('model', e.target.value as ClaudeModelId)}
              className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <option value="claude-opus-5-5">claude-opus-5-5 ($0.04)</option>
              <option value="claude-sonnet-5-5">claude-sonnet-5-5 ($0.02)</option>
            </select>
          </div>

          <div>
            <label htmlFor="min-score" className="block text-xs font-medium text-slate-700 mb-1.5">
              Порог отбора ИИ (nota_minima: {state.ai.nota_minima}/10)
            </label>
            <input
              id="min-score"
              type="range"
              min={1}
              max={10}
              value={state.ai.nota_minima}
              onChange={(e) => onUpdateAi('nota_minima', Number(e.target.value))}
              className="w-full h-10 accent-blue-600"
            />
          </div>

          <div>
            <label htmlFor="daily-budget" className="block text-xs font-medium text-slate-700 mb-1.5">
              Дневной бюджет ($ USD)
            </label>
            <input
              id="daily-budget"
              type="number"
              min={0.5}
              max={100}
              step={0.5}
              value={state.ai.orcamento_diario_usd}
              onChange={(e) => onUpdateAi('orcamento_diario_usd', Math.max(0.5, Number(e.target.value) || 0.5))}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus-visible:outline-2 focus-visible:outline-blue-600"
            />
          </div>

          <div>
            <label htmlFor="clips-per-day" className="block text-xs font-medium text-slate-700 mb-1.5">
              Ожидаемых триггеров / день
            </label>
            <input
              id="clips-per-day"
              type="number"
              min={1}
              max={300}
              value={state.ai.estimatedClipsPerDay}
              onChange={(e) => onUpdateAi('estimatedClipsPerDay', Math.max(1, Number(e.target.value) || 1))}
              className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus-visible:outline-2 focus-visible:outline-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          <div>
            <div className="text-xs text-slate-500">Анализов в день</div>
            <div className="mt-0.5 text-lg font-semibold font-mono tabular-nums text-slate-900">
              {cost.effectiveDailyAnalyses}
              {cost.cappedByBudget ? ' (упёрся в лимит)' : ''}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Расход в день</div>
            <div className="mt-0.5 text-lg font-semibold font-mono tabular-nums text-slate-900">
              ${cost.dailyUsd.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Прогноз за 30 дней</div>
            <div className="mt-0.5 text-lg font-semibold font-mono tabular-nums text-slate-900">
              ${cost.monthlyUsd.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center">
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={state.ai.enviar_reprovados}
                onChange={(e) => onUpdateAi('enviar_reprovados', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-blue-600"
              />
              <span>Слать отклонённые ИИ для калибровки</span>
            </label>
          </div>
        </div>
      </section>

      {/* 3. Каналы мониторинга */}
      <section aria-labelledby="channels-heading" className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 id="channels-heading" className="text-base font-semibold text-slate-900">
              03. Каналы мониторинга ([[canais]])
            </h2>
            <p className="text-sm text-slate-500">
              Дождь клипов на Twitch работает автоматически при наличии ключей Twitch.
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            Активно {state.channels.filter((c) => c.enabled).length} из {state.channels.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <th className="py-2.5 px-4">Вкл</th>
                <th className="py-2.5 px-4">Стример</th>
                <th className="py-2.5 px-4">Платформа</th>
                <th className="py-2.5 px-4">Канал</th>
                <th className="py-2.5 px-4">Язык</th>
                <th className="py-2.5 px-4">Макет камеры</th>
                <th className="py-2.5 px-4">Детектор</th>
                <th className="py-2.5 px-4 text-right">Min msgs</th>
                <th className="py-2.5 px-4 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {state.channels.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-slate-500">
                    Список каналов пуст. Добавьте хотя бы одного стримера ниже.
                  </td>
                </tr>
              ) : (
                state.channels.map((ch) => {
                  const rowSlugError = ch.enabled ? validateChannelSlug(ch.plataforma, ch.canal) : null;
                  return (
                    <Fragment key={ch.id}>
                      <tr className={`hover:bg-slate-50 ${!ch.enabled ? 'opacity-50' : ''}`}>
                        <td className="py-2.5 px-4">
                          <input
                            type="checkbox"
                            checked={ch.enabled}
                            aria-label={`Включить канал ${ch.nome}`}
                            onChange={() => onToggleChannel(ch.id)}
                            className="w-4 h-4 accent-blue-600"
                          />
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-900 whitespace-nowrap">{ch.nome}</td>
                        <td className="py-2.5 px-4 text-slate-600 font-mono text-xs">{ch.plataforma}</td>
                        <td className="py-2.5 px-4">
                          <div className="text-slate-700 font-mono text-xs">{ch.canal}</div>
                          {rowSlugError && <div className="text-[11px] text-red-600 mt-0.5">{rowSlugError}</div>}
                        </td>
                        <td className="py-2.5 px-4">
                          <select
                            aria-label={`Язык для ${ch.nome}`}
                            value={ch.idioma}
                            onChange={(e) => onUpdateChannelField(ch.id, 'idioma', e.target.value as 'en' | 'ru' | 'pt')}
                            className="h-8 px-2 text-xs bg-white border border-slate-200 rounded"
                          >
                            <option value="en">en</option>
                            <option value="ru">ru</option>
                            <option value="pt">pt</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-4">
                          <select
                            aria-label={`Макет камеры для ${ch.nome}`}
                            value={ch.layout}
                            onChange={(e) =>
                              onUpdateChannelField(ch.id, 'layout', e.target.value as ChannelLayout)
                            }
                            className="h-8 px-2 text-xs bg-white border border-slate-200 rounded"
                          >
                            <option value="auto">auto</option>
                            <option value="fundo">fundo (без камеры)</option>
                            <option value="facecam">facecam</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-4">
                          <select
                            aria-label={`Режим детекции для ${ch.nome}`}
                            value={ch.deteccao}
                            onChange={(e) =>
                              onUpdateChannelField(ch.id, 'deteccao', e.target.value as DetectionMode)
                            }
                            className="h-8 px-2 text-xs bg-white border border-slate-200 rounded"
                          >
                            <option value="chat">chat</option>
                            <option value="ambos">ambos (чат + аудио)</option>
                            <option value="audio">audio</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <input
                            type="number"
                            min={5}
                            max={200}
                            aria-label={`Порог сообщений для ${ch.nome}`}
                            value={ch.min_msgs}
                            onChange={(e) =>
                              onUpdateChannelField(ch.id, 'min_msgs', Math.max(5, Number(e.target.value) || 5))
                            }
                            className="w-16 h-8 px-2 text-right text-xs font-mono tabular-nums bg-white border border-slate-200 rounded"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            aria-label={`Удалить канал ${ch.nome}`}
                            onClick={() => onRemoveChannel(ch.id)}
                            className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                      {ch.layout === 'facecam' && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={9} className="px-4 py-2.5 text-xs">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-medium text-slate-700">
                                Координаты facecam [x, y, w, h] в долях 0..1:
                              </span>
                              {(['x', 'y', 'w', 'h'] as const).map((axis, idx) => (
                                <label key={axis} className="inline-flex items-center gap-1 text-slate-600">
                                  <span className="font-mono">{axis}</span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    placeholder="auto"
                                    value={ch.facecam ? ch.facecam[idx as 0 | 1 | 2 | 3] : ''}
                                    onChange={(e) =>
                                      updateFacecamCoord(
                                        ch,
                                        idx as 0 | 1 | 2 | 3,
                                        Number(e.target.value)
                                      )
                                    }
                                    className="w-16 h-7 px-1.5 font-mono tabular-nums bg-white border border-slate-200 rounded"
                                  />
                                </label>
                              ))}
                              {ch.facecam ? (
                                <button
                                  type="button"
                                  onClick={() => onUpdateChannelField(ch.id, 'facecam', undefined)}
                                  className="text-xs text-slate-600 hover:text-slate-900 underline"
                                >
                                  Очистить координаты
                                </button>
                              ) : (
                                <span className="text-slate-500">Без координат поведёт себя как auto</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Добавление нового канала */}
        <form onSubmit={handleAddSubmit} className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 items-end">
            <div className="lg:col-span-1">
              <label htmlFor="add-name" className="block text-xs font-medium text-slate-600 mb-1">
                Имя стримера
              </label>
              <input
                id="add-name"
                type="text"
                placeholder="xQc"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full h-9 px-2.5 text-sm bg-white border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label htmlFor="add-platform" className="block text-xs font-medium text-slate-600 mb-1">
                Платформа
              </label>
              <select
                id="add-platform"
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value as Platform)}
                className="w-full h-9 px-2 text-sm bg-white border border-slate-200 rounded-md"
              >
                <option value="twitch">twitch</option>
                <option value="youtube">youtube</option>
                <option value="kick">kick</option>
              </select>
            </div>
            <div className="lg:col-span-1">
              <label htmlFor="add-handle" className="block text-xs font-medium text-slate-600 mb-1">
                Канал / @handle
              </label>
              <input
                id="add-handle"
                type="text"
                placeholder={newPlatform === 'youtube' ? '@xQc' : 'xqc'}
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                className={`w-full h-9 px-2.5 text-sm font-mono bg-white border rounded-md ${
                  liveSlugError ? 'border-red-500' : 'border-slate-200'
                }`}
              />
            </div>
            <div>
              <label htmlFor="add-layout" className="block text-xs font-medium text-slate-600 mb-1">
                Камера
              </label>
              <select
                id="add-layout"
                value={newLayout}
                onChange={(e) => setNewLayout(e.target.value as ChannelLayout)}
                className="w-full h-9 px-2 text-sm bg-white border border-slate-200 rounded-md"
              >
                <option value="auto">auto</option>
                <option value="fundo">fundo</option>
                <option value="facecam">facecam</option>
              </select>
            </div>
            <div>
              <label htmlFor="add-det" className="block text-xs font-medium text-slate-600 mb-1">
                Детектор
              </label>
              <select
                id="add-det"
                value={newDetection}
                onChange={(e) => setNewDetection(e.target.value as DetectionMode)}
                className="w-full h-9 px-2 text-sm bg-white border border-slate-200 rounded-md"
              >
                <option value="ambos">ambos</option>
                <option value="chat">chat</option>
                <option value="audio">audio</option>
              </select>
            </div>
            <div>
              <label htmlFor="add-minmsgs" className="block text-xs font-medium text-slate-600 mb-1">
                Min msgs
              </label>
              <input
                id="add-minmsgs"
                type="number"
                min={5}
                max={200}
                value={newMinMsgs}
                onChange={(e) => setNewMinMsgs(Number(e.target.value))}
                className="w-full h-9 px-2.5 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={Boolean(liveSlugError)}
                className="w-full h-9 inline-flex items-center justify-center gap-1.5 px-3 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Добавить
              </button>
            </div>
          </div>
          {(liveSlugError || channelError) && (
            <p className="text-xs text-red-600 font-medium">{liveSlugError || channelError}</p>
          )}
        </form>
      </section>

      {/* 4. Рендер, хэштеги и SYSTEM-промпт */}
      <section aria-labelledby="render-heading" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <h2 id="render-heading" className="text-base font-semibold text-slate-900">
            04. Формат видео и детектор
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="watermark-handle" className="block text-xs font-medium text-slate-700 mb-1.5">
                Водяной знак профиля (perfil_tiktok)
              </label>
              <input
                id="watermark-handle"
                type="text"
                value={state.general.perfil_tiktok}
                onChange={(e) => onUpdateGeneral('perfil_tiktok', e.target.value)}
                className={`w-full h-10 px-3 text-sm font-mono bg-white border rounded-lg ${
                  tiktokError ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {tiktokError && <p className="mt-1 text-xs text-red-600">{tiktokError}</p>}
            </div>

            <div>
              <label htmlFor="video-layout" className="block text-xs font-medium text-slate-700 mb-1.5">
                Соотношение сторон (layout_video)
              </label>
              <select
                id="video-layout"
                value={state.general.layout_video}
                onChange={(e) => onUpdateGeneral('layout_video', e.target.value as VideoLayout)}
                className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg"
              >
                <option value="vertical">vertical (9:16 TikTok & Shorts)</option>
                <option value="noticia">noticia (4:5 новостная карточка)</option>
              </select>
            </div>

            <div>
              <label htmlFor="subtitle-style" className="block text-xs font-medium text-slate-700 mb-1.5">
                Стиль субтитров (estilo_legenda)
              </label>
              <select
                id="subtitle-style"
                value={state.general.estilo_legenda}
                onChange={(e) => onUpdateGeneral('estilo_legenda', e.target.value as SubtitleStyle)}
                className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg"
              >
                <option value="karaoke">karaoke</option>
                <option value="neon">neon</option>
                <option value="classico">classico</option>
                <option value="por_do_sol">por_do_sol</option>
                <option value="faixa">faixa</option>
                <option value="hq">hq</option>
              </select>
            </div>

            <div>
              <label htmlFor="mult-min" className="block text-xs font-medium text-slate-700 mb-1.5">
                Множитель всплеска чата (multiplicador_minimo)
              </label>
              <input
                id="mult-min"
                type="number"
                step={0.1}
                min={1.2}
                max={8}
                value={state.detector.multiplicador_minimo}
                onChange={(e) =>
                  onUpdateDetector('multiplicador_minimo', Math.max(1.2, Number(e.target.value) || 2.5))
                }
                className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="cooldown-sec" className="block text-xs font-medium text-slate-700 mb-1.5">
                Пауза между триггерами (сек)
              </label>
              <input
                id="cooldown-sec"
                type="number"
                min={15}
                max={600}
                value={state.detector.cooldown_segundos}
                onChange={(e) =>
                  onUpdateDetector('cooldown_segundos', Math.max(15, Number(e.target.value) || 60))
                }
                className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="fixed-hashtags" className="block text-xs font-medium text-slate-700 mb-1.5">
                Фиксированные хэштеги (4 шт. к имени стримера)
              </label>
              <input
                id="fixed-hashtags"
                type="text"
                value={tagDraft}
                onChange={(e) => {
                  setTagDraft(e.target.value);
                  const parsed = e.target.value
                    .split(',')
                    .map((t) => t.replace(/^#/, '').trim())
                    .filter(Boolean)
                    .slice(0, 4);
                  if (parsed.length > 0) onUpdateHashtags(parsed);
                }}
                className="w-full h-10 px-3 text-sm font-mono bg-white border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              05. Системный промпт куратора (curator.py)
            </h2>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {state.systemPrompt.length} симв.
            </span>
          </div>
          <label htmlFor="system-prompt-editor" className="sr-only">
            Системный промпт для Claude
          </label>
          <textarea
            id="system-prompt-editor"
            rows={10}
            value={state.systemPrompt}
            onChange={(e) => onUpdateSystemPrompt(e.target.value)}
            className="w-full p-3 text-xs font-mono leading-relaxed bg-slate-50 border border-slate-200 rounded-lg focus-visible:outline-2 focus-visible:outline-blue-600"
          />
        </div>
      </section>
    </div>
  );
}
