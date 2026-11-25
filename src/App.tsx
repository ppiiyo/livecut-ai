import { useEffect, useState } from 'react';
import { PackageCheck } from 'lucide-react';
import {
  ChannelConfig,
  PipelineState,
  PresetId,
  SimulatedClip,
  ViewId
} from './types/pipeline';
import {
  DEFAULT_STATE,
  INITIAL_SIMULATED_CLIPS,
  PRESET_CHANNELS,
  PRESET_METADATA,
  SETUP_CHECKLIST,
  SYSTEM_PROMPTS
} from './data/presets';
import {
  parseStoredPipelineState,
  serializeStateWithoutSecrets,
  STORAGE_KEY
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { PipelineView } from './components/PipelineView';
import { SimulatorView } from './components/SimulatorView';
import { SetupView } from './components/SetupView';
import { ExportView } from './components/ExportView';
import { ConfirmDialog } from './components/ConfirmDialog';

const VIEW_TITLES: Record<ViewId, string> = {
  pipeline: 'Конвейер и каналы',
  simulator: 'Симулятор клипов',
  setup: 'Ключи и чек-лист',
  export: 'Сборка и экспорт'
};

function loadInitialState(): PipelineState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return parseStoredPipelineState(raw);
  } catch {
    return DEFAULT_STATE;
  }
}

type PendingConfirm =
  | { type: 'preset'; presetId: PresetId; label: string }
  | { type: 'reset' }
  | null;

export default function App() {
  const [state, setState] = useState<PipelineState>(loadInitialState);
  const [activeView, setActiveView] = useState<ViewId>('pipeline');
  const [clips, setClips] = useState<SimulatedClip[]>(INITIAL_SIMULATED_CLIPS);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serializeStateWithoutSecrets(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const applyPresetNow = (presetId: PresetId) => {
    const meta = PRESET_METADATA[presetId];
    setState((prev) => ({
      ...prev,
      presetId,
      channels: PRESET_CHANNELS[presetId].map((c) => ({ ...c })),
      systemPrompt: SYSTEM_PROMPTS[presetId],
      hashtags: [...meta.hashtags],
      extraReactions: [...meta.extraReactions],
      extraSpamTerms: [...meta.extraSpamTerms],
      general: {
        ...prev.general,
        layout_video: 'vertical'
      }
    }));
  };

  const handleRequestPreset = (presetId: PresetId) => {
    if (presetId === state.presetId) return;
    setPendingConfirm({
      type: 'preset',
      presetId,
      label: PRESET_METADATA[presetId].label
    });
  };

  const handleConfirmAction = () => {
    if (!pendingConfirm) return;
    if (pendingConfirm.type === 'preset') {
      applyPresetNow(pendingConfirm.presetId);
    } else {
      setState(DEFAULT_STATE);
      setClips(INITIAL_SIMULATED_CLIPS);
    }
    setPendingConfirm(null);
  };

  const handleUpdateGeneral = <K extends keyof PipelineState['general']>(
    key: K,
    value: PipelineState['general'][K]
  ) => {
    setState((prev) => ({
      ...prev,
      general: { ...prev.general, [key]: value }
    }));
  };

  const handleUpdateDetector = <K extends keyof PipelineState['detector']>(
    key: K,
    value: PipelineState['detector'][K]
  ) => {
    setState((prev) => ({
      ...prev,
      detector: { ...prev.detector, [key]: value }
    }));
  };

  const handleUpdateAi = <K extends keyof PipelineState['ai']>(
    key: K,
    value: PipelineState['ai'][K]
  ) => {
    setState((prev) => ({
      ...prev,
      ai: { ...prev.ai, [key]: value }
    }));
  };

  const handleAddChannel = (channel: Omit<ChannelConfig, 'id'>) => {
    const id = `ch-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      channels: [...prev.channels, { ...channel, id }]
    }));
  };

  const handleToggleChannel = (id: string) => {
    setState((prev) => ({
      ...prev,
      channels: prev.channels.map((ch) => (ch.id === id ? { ...ch, enabled: !ch.enabled } : ch))
    }));
  };

  const handleUpdateChannelField = <K extends keyof ChannelConfig>(
    id: string,
    key: K,
    value: ChannelConfig[K]
  ) => {
    setState((prev) => ({
      ...prev,
      channels: prev.channels.map((ch) => (ch.id === id ? { ...ch, [key]: value } : ch))
    }));
  };

  const handleRemoveChannel = (id: string) => {
    setState((prev) => ({
      ...prev,
      channels: prev.channels.filter((ch) => ch.id !== id)
    }));
  };

  const handleClipAction = (
    clipId: string,
    action: 'analyze' | 'full' | 'discard' | 'posted' | 'camera' | 'reset'
  ) => {
    setClips((prev) =>
      prev.map((clip) => {
        if (clip.id !== clipId) return clip;
        if (action === 'analyze' || action === 'full') return { ...clip, stage: 'analyzed' };
        if (action === 'posted') return { ...clip, stage: 'posted' };
        if (action === 'discard') return { ...clip, stage: 'discarded' };
        if (action === 'camera') return { ...clip, stage: 'camera_flagged' };
        return { ...clip, stage: 'preview' };
      })
    );
  };

  const handleUpdateEnv = <K extends keyof PipelineState['env']>(key: K, value: string) => {
    setState((prev) => ({
      ...prev,
      env: { ...prev.env, [key]: value }
    }));
  };

  const handleUpdateRepo = <K extends keyof PipelineState['repo']>(
    key: K,
    value: PipelineState['repo'][K]
  ) => {
    setState((prev) => ({
      ...prev,
      repo: { ...prev.repo, [key]: value }
    }));
  };

  const handleToggleChecklist = (stepId: string) => {
    setState((prev) => {
      const exists = prev.completedChecklistIds.includes(stepId);
      return {
        ...prev,
        completedChecklistIds: exists
          ? prev.completedChecklistIds.filter((id) => id !== stepId)
          : [...prev.completedChecklistIds, stepId]
      };
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        activeChannelsCount={state.channels.filter((c) => c.enabled).length}
        manualMode={state.ai.aprovacao_manual}
        completedSteps={state.completedChecklistIds.length}
        totalSteps={SETUP_CHECKLIST.length}
        onResetDefaults={() => setPendingConfirm({ type: 'reset' })}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-8 shrink-0">
          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-slate-500 whitespace-nowrap">Проекты</span>
            <span className="text-slate-300" aria-hidden="true">/</span>
            <span className="text-slate-500 whitespace-nowrap truncate">{state.repo.repoName || 'livecut-en'}</span>
            <span className="text-slate-300" aria-hidden="true">/</span>
            <h1 className="font-semibold text-slate-900 whitespace-nowrap truncate">{VIEW_TITLES[activeView]}</h1>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('export')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <PackageCheck className="w-4 h-4" aria-hidden="true" />
              Собрать пакет
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          {activeView === 'pipeline' && (
            <PipelineView
              state={state}
              onApplyPreset={handleRequestPreset}
              onUpdateGeneral={handleUpdateGeneral}
              onUpdateDetector={handleUpdateDetector}
              onUpdateAi={handleUpdateAi}
              onAddChannel={handleAddChannel}
              onToggleChannel={handleToggleChannel}
              onUpdateChannelField={handleUpdateChannelField}
              onRemoveChannel={handleRemoveChannel}
              onUpdateSystemPrompt={(prompt) => setState((prev) => ({ ...prev, systemPrompt: prompt }))}
              onUpdateHashtags={(tags) => setState((prev) => ({ ...prev, hashtags: tags }))}
            />
          )}

          {activeView === 'simulator' && (
            <SimulatorView
              state={state}
              clips={clips}
              onClipAction={handleClipAction}
              onUpdateLayout={(layout) => handleUpdateGeneral('layout_video', layout)}
              onAddReactionToken={(token) =>
                setState((prev) => ({
                  ...prev,
                  extraReactions: prev.extraReactions.includes(token)
                    ? prev.extraReactions
                    : [...prev.extraReactions, token]
                }))
              }
              onRemoveReactionToken={(token) =>
                setState((prev) => ({
                  ...prev,
                  extraReactions: prev.extraReactions.filter((r) => r !== token)
                }))
              }
              onAddSpamTerm={(term) =>
                setState((prev) => ({
                  ...prev,
                  extraSpamTerms: prev.extraSpamTerms.includes(term)
                    ? prev.extraSpamTerms
                    : [...prev.extraSpamTerms, term]
                }))
              }
            />
          )}

          {activeView === 'setup' && (
            <SetupView
              state={state}
              onUpdateEnv={handleUpdateEnv}
              onUpdateRepo={handleUpdateRepo}
              onToggleChecklist={handleToggleChecklist}
            />
          )}

          {activeView === 'export' && <ExportView state={state} />}
        </main>
      </div>

      <ConfirmDialog
        open={pendingConfirm !== null}
        title={pendingConfirm?.type === 'reset' ? 'Сбросить к дефолтам?' : 'Переключить пресет?'}
        message={
          pendingConfirm?.type === 'reset'
            ? 'Заменить текущие каналы, промпт и настройки значениями по умолчанию? Отменить нельзя.'
            : `Заменить текущие каналы и промпт пресетом «${pendingConfirm?.type === 'preset' ? pendingConfirm.label : ''}»? Отменить нельзя.`
        }
        confirmLabel={pendingConfirm?.type === 'reset' ? 'Сбросить' : 'Заменить'}
        onConfirm={handleConfirmAction}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  );
}
