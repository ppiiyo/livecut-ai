import { useState } from 'react';
import { Copy, Check, Video, MessageSquareText, RotateCcw } from 'lucide-react';
import { PipelineState, SimulatedClip } from '../types/pipeline';
import { testChatMessage } from '../utils/generator';

interface SimulatorViewProps {
  state: PipelineState;
  clips: SimulatedClip[];
  onClipAction: (clipId: string, action: 'analyze' | 'full' | 'discard' | 'posted' | 'camera' | 'reset') => void;
  onUpdateLayout: (layout: 'vertical' | 'noticia') => void;
  onAddReactionToken: (token: string) => void;
  onRemoveReactionToken: (token: string) => void;
  onAddSpamTerm: (term: string) => void;
}

function renderHeadlineWithHighlight(headline: string) {
  const parts = headline.split(/\*([^*]+)\*/g);
  return parts.map((part, idx) =>
    idx % 2 === 1 ? (
      <span key={idx} className="bg-amber-400 text-slate-950 px-1 rounded-xs">
        {part}
      </span>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
}

const STAGE_LABELS: Record<SimulatedClip['stage'], { text: string; colorClass: string }> = {
  preview: { text: 'Ожидает подтверждения', colorClass: 'text-amber-700' },
  analyzed: { text: 'Готов к публикации', colorClass: 'text-emerald-700' },
  posted: { text: 'Опубликован', colorClass: 'text-blue-700' },
  discarded: { text: 'Отклонён', colorClass: 'text-slate-500' },
  camera_flagged: { text: 'Перерендер камеры', colorClass: 'text-amber-700' }
};

export function SimulatorView({
  state,
  clips,
  onClipAction,
  onUpdateLayout,
  onAddReactionToken,
  onRemoveReactionToken,
  onAddSpamTerm
}: SimulatorViewProps) {
  const [selectedId, setSelectedId] = useState<string>(clips[0]?.id ?? '');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [chatInput, setChatInput] = useState('NO WAY he is cooked 💀');
  const [newReaction, setNewReaction] = useState('');
  const [newSpam, setNewSpam] = useState('');

  const activeClip = clips.find((c) => c.id === selectedId) ?? clips[0];
  const stageMeta = activeClip ? STAGE_LABELS[activeClip.stage] : null;
  const streamerTag = activeClip ? activeClip.streamer.toLowerCase().replace(/[^a-z0-9]/g, '') : 'streamer';
  const fullTags = [streamerTag, ...state.hashtags].map((t) => `#${t}`).join(' ');
  const fullCaptionText = activeClip ? `${activeClip.caption}\n\n${fullTags}` : '';

  const chatCheck = testChatMessage(chatInput, state.extraReactions, state.extraSpamTerms);

  const handleCopyCaption = async () => {
    if (!fullCaptionText) return;
    try {
      await navigator.clipboard.writeText(fullCaptionText);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 1800);
    } catch {
      setCopiedCaption(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Очередь клипов и предпросмотр */}
      <section aria-labelledby="sim-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 id="sim-heading" className="text-base font-semibold text-slate-900">
              01. Симулятор Telegram-бота и макета видео
            </h2>
            <p className="text-sm text-slate-500">
              Проверьте итоговый кадр, подпись с фиксированными хэштегами и переходы состояний клипа.
            </p>
          </div>

          <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => onUpdateLayout('vertical')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                state.general.layout_video === 'vertical'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              9:16 Vertical
            </button>
            <button
              type="button"
              onClick={() => onUpdateLayout('noticia')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                state.general.layout_video === 'noticia'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              4:5 News Card
            </button>
          </div>
        </div>

        {/* Выбор клипа из очереди */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {clips.map((clip) => {
            const selected = clip.id === activeClip?.id;
            const meta = STAGE_LABELS[clip.stage];
            return (
              <button
                key={clip.id}
                type="button"
                onClick={() => setSelectedId(clip.id)}
                className={`p-3.5 text-left rounded-lg border transition-colors ${
                  selected
                    ? 'bg-white border-blue-600 ring-1 ring-blue-600'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-mono tabular-nums">#{clip.clipNumber} · {clip.platform}</span>
                  <span className={`font-medium ${meta.colorClass}`}>{meta.text}</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 truncate">{clip.streamer}</div>
                <div className="mt-0.5 text-xs text-slate-500 truncate">{clip.triggerLabel}</div>
              </button>
            );
          })}
        </div>

        {activeClip && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Видеофрейм */}
            <div className="lg:col-span-5 bg-slate-950 rounded-lg p-6 flex flex-col items-center justify-center border border-slate-800">
              <div
                className={`w-full max-w-[290px] bg-slate-900 border border-slate-700 rounded-lg overflow-hidden flex flex-col justify-between relative ${
                  state.general.layout_video === 'vertical' ? 'aspect-[9/16]' : 'aspect-[4/5]'
                }`}
              >
                {/* Верхняя часть — геймплей / вебкамка */}
                {activeClip.channelLayout === 'fundo' ? (
                  <div className="flex-1 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="font-mono">Live: {activeClip.streamer}</span>
                      <span className="font-mono">{state.general.perfil_tiktok || '@your_handle'}</span>
                    </div>
                    <div className="text-center space-y-2 my-auto">
                      <Video className="w-8 h-8 text-slate-500 mx-auto" aria-hidden="true" />
                      <div className="text-xs text-slate-400">Режим fundo · полный кадр + блюр-фон</div>
                    </div>
                    <div className="text-center">
                      <span className="inline-block px-2 py-1 bg-black/75 text-amber-300 text-xs font-extrabold uppercase tracking-wide rounded">
                        {activeClip.subtitleSample[1]}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col">
                    <div className="h-[36%] bg-slate-800 border-b border-slate-700 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[11px] text-slate-300">
                        <span className="font-mono">Live: {activeClip.streamer}</span>
                        <span className="font-mono">{state.general.perfil_tiktok || '@your_handle'}</span>
                      </div>
                      <div className="text-center text-xs text-slate-400 my-auto">
                        Вебкамка (YuNet + SFace авто-кроп)
                      </div>
                    </div>
                    <div className="flex-1 bg-gradient-to-b from-slate-900 to-slate-950 p-4 flex flex-col justify-between">
                      <div className="text-center text-xs font-bold uppercase tracking-wide text-white bg-black/60 px-2 py-1 rounded">
                        {activeClip.hook}
                      </div>
                      <div className="text-center my-auto text-xs text-slate-400">
                        Основной экран GTA 6 (1080p60)
                      </div>
                      <div className="text-center">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-extrabold uppercase rounded ${
                            state.general.estilo_legenda === 'karaoke'
                              ? 'bg-black/80 text-yellow-300'
                              : state.general.estilo_legenda === 'neon'
                              ? 'bg-slate-950 text-sky-300'
                              : 'bg-black/80 text-white'
                          }`}
                        >
                          {activeClip.subtitleSample[2]}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Нижняя новостная плашка только для режима 4:5 noticia */}
                {state.general.layout_video === 'noticia' && (
                  <div className="bg-white text-slate-900 p-3.5 border-t border-slate-200 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                      GTA 6 · {activeClip.streamer.toUpperCase()}
                    </div>
                    <div className="text-xs font-bold leading-snug">
                      {renderHeadlineWithHighlight(activeClip.headline)}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-slate-400 font-mono tabular-nums">
                {state.general.layout_video === 'vertical' ? '1080x1920 (9:16)' : '1080x1350 (4:5)'} · субтитры: {state.general.estilo_legenda}
              </div>
            </div>

            {/* Сообщение Telegram-бота */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs text-slate-500 font-mono tabular-nums">
                    Telegram Bot · Клип #{activeClip.clipNumber} · {activeClip.detectedAt}
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">
                    {activeClip.streamer} — оценка ИИ {activeClip.score}/10
                  </h3>
                </div>
                {stageMeta && (
                  <span className={`text-xs font-semibold ${stageMeta.colorClass}`}>
                    Статус: {stageMeta.text}
                  </span>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-medium text-slate-500">Детектор и тайминг</div>
                  <div className="mt-0.5 text-slate-800 font-mono text-xs tabular-nums">
                    {activeClip.triggerLabel} · длительность {activeClip.durationSec}s · порог nota_minima {state.ai.nota_minima}/10
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-slate-500">Транскрипт Whisper</div>
                  <p className="mt-1 text-xs text-slate-700 bg-slate-50 rounded-md p-3 leading-relaxed">
                    «{activeClip.transcriptSnippet}»
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500">
                      Caption for TikTok / Shorts (готово для копирования)
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCaption}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      {copiedCaption ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                      {copiedCaption ? 'Скопировано' : 'Копировать подпись'}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-md text-xs text-slate-900 whitespace-pre-line font-mono">
                    {fullCaptionText}
                  </div>
                </div>
              </div>

              {/* Кнопки Telegram */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="text-xs font-medium text-slate-500">
                  Интерактивные кнопки в Telegram ({state.ai.aprovacao_manual ? 'ручная калибровка' : 'полный автомат'})
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeClip.stage === 'preview' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onClipAction(activeClip.id, 'analyze')}
                        className="px-3 py-2 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 whitespace-nowrap"
                      >
                        Analyze with AI (~${state.ai.model === 'claude-opus-5-5' ? '0.04' : '0.02'})
                      </button>
                      <button
                        type="button"
                        onClick={() => onClipAction(activeClip.id, 'full')}
                        className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 whitespace-nowrap"
                      >
                        Use full segment
                      </button>
                      <button
                        type="button"
                        onClick={() => onClipAction(activeClip.id, 'discard')}
                        className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 text-red-700 rounded-md hover:bg-red-50 whitespace-nowrap"
                      >
                        Discard
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onClipAction(activeClip.id, 'posted')}
                        className="px-3 py-2 text-xs font-medium bg-emerald-700 text-white rounded-md hover:bg-emerald-800 whitespace-nowrap"
                      >
                        Posted
                      </button>
                      <button
                        type="button"
                        onClick={() => onClipAction(activeClip.id, 'camera')}
                        className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50 whitespace-nowrap"
                      >
                        Wrong camera
                      </button>
                      <button
                        type="button"
                        onClick={() => onClipAction(activeClip.id, 'discard')}
                        className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 text-red-700 rounded-md hover:bg-red-50 whitespace-nowrap"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={() => onClipAction(activeClip.id, 'reset')}
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-900 whitespace-nowrap"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        Сбросить статус
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. Тестер словаря реакций и анти-спама (detector.py) */}
      <section aria-labelledby="detector-test-heading" className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="detector-test-heading" className="text-base font-semibold text-slate-900">
              02. Тестер реакций чата и анти-спам фильтра (detector.py)
            </h2>
            <p className="text-sm text-slate-500">
              Проверьте любое сообщение из чата стримера — попадёт ли оно в триггер реакций или будет отсеяно как реклама/розыгрыш.
            </p>
          </div>
          <MessageSquareText className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label htmlFor="chat-sample-input" className="block text-xs font-medium text-slate-700">
              Тестовое сообщение чата
            </label>
            <input
              id="chat-sample-input"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Введите сообщение из чата..."
              className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg"
            />
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                'NO WAY he is cooked 💀',
                'use code SPEED for 20% off',
                'ахахах ору что он делает',
                'just watching the stream'
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setChatInput(sample)}
                  className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-600 font-mono"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 space-y-2">
            <div className="text-xs font-medium text-slate-500">Результат проверки detector.py</div>
            <div className="text-sm font-semibold">
              {chatCheck.verdict === 'trigger_candidate' && (
                <span className="text-emerald-700">Сработает как реакция чата (ускоряет триггер клипа)</span>
              )}
              {chatCheck.verdict === 'ignored_spam' && (
                <span className="text-red-700">Отфильтровано как реклама / розыгрыш</span>
              )}
              {chatCheck.verdict === 'neutral' && (
                <span className="text-slate-600">Обычное сообщение (реакций не найдено)</span>
              )}
            </div>
            <div className="text-xs text-slate-600 font-mono">
              Реакции: {chatCheck.matchedReactions.length ? chatCheck.matchedReactions.join(', ') : 'нет'} · Спам:{' '}
              {chatCheck.matchedSpam.length ? chatCheck.matchedSpam.join(', ') : 'нет'}
            </div>
          </div>
        </div>

        {/* Редактирование дополнительных токенов */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          <div className="space-y-2">
            <label htmlFor="add-reaction-input" className="block text-xs font-medium text-slate-700">
              Дополнительные слова-реакции (добавятся в detector.py)
            </label>
            <div className="flex gap-2">
              <input
                id="add-reaction-input"
                type="text"
                value={newReaction}
                onChange={(e) => setNewReaction(e.target.value)}
                placeholder="например: cinema"
                className="flex-1 h-9 px-3 text-sm font-mono bg-white border border-slate-200 rounded-md"
              />
              <button
                type="button"
                onClick={() => {
                  if (newReaction.trim()) {
                    onAddReactionToken(newReaction.trim());
                    setNewReaction('');
                  }
                }}
                className="px-3 h-9 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 whitespace-nowrap"
              >
                Добавить слово
              </button>
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">
              {state.extraReactions.map((token, idx) => (
                <span key={token}>
                  {idx > 0 && ' · '}
                  <button
                    type="button"
                    onClick={() => onRemoveReactionToken(token)}
                    title="Нажмите, чтобы удалить"
                    className="font-mono hover:text-red-600 hover:line-through"
                  >
                    {token}
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="add-spam-input" className="block text-xs font-medium text-slate-700">
              Дополнительные стоп-слова рекламы/розыгрышей
            </label>
            <div className="flex gap-2">
              <input
                id="add-spam-input"
                type="text"
                value={newSpam}
                onChange={(e) => setNewSpam(e.target.value)}
                placeholder="например: airdrop"
                className="flex-1 h-9 px-3 text-sm font-mono bg-white border border-slate-200 rounded-md"
              />
              <button
                type="button"
                onClick={() => {
                  if (newSpam.trim()) {
                    onAddSpamTerm(newSpam.trim());
                    setNewSpam('');
                  }
                }}
                className="px-3 h-9 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800 whitespace-nowrap"
              >
                Добавить стоп-слово
              </button>
            </div>
            <div className="text-xs text-slate-600 font-mono leading-relaxed">
              {state.extraSpamTerms.join(' · ')}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
