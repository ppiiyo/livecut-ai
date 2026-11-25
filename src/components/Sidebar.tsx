import { Sliders, PlaySquare, KeyRound, PackageCheck, RotateCcw } from 'lucide-react';
import { ViewId } from '../types/pipeline';

interface SidebarProps {
  activeView: ViewId;
  onSelectView: (view: ViewId) => void;
  activeChannelsCount: number;
  manualMode: boolean;
  completedSteps: number;
  totalSteps: number;
  onResetDefaults: () => void;
}

const NAV_ITEMS: Array<{ id: ViewId; label: string; icon: typeof Sliders }> = [
  { id: 'pipeline', label: 'Конвейер и каналы', icon: Sliders },
  { id: 'simulator', label: 'Симулятор клипов', icon: PlaySquare },
  { id: 'setup', label: 'Ключи и чек-лист', icon: KeyRound },
  { id: 'export', label: 'Сборка и экспорт', icon: PackageCheck }
];

export function Sidebar({
  activeView,
  onSelectView,
  activeChannelsCount,
  manualMode,
  completedSteps,
  totalSteps,
  onResetDefaults
}: SidebarProps) {
  return (
    <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col justify-between">
      <div className="p-4 lg:p-5 space-y-6">
        <div className="px-2">
          <div className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap">
            LiveCut Studio
          </div>
          <p className="mt-1 text-xs text-slate-500">
            База: Teodorox/livecut-ai
          </p>
        </div>

        <nav aria-label="Разделы конфигуратора" className="grid grid-cols-2 lg:grid-cols-1 gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="hidden lg:block p-5 border-t border-slate-200 space-y-3">
        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span>Активные каналы</span>
            <span className="font-mono tabular-nums font-medium text-slate-900">{activeChannelsCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Режим отбора</span>
            <span className="font-medium text-slate-900">{manualMode ? 'Калибровка' : 'Автопилот'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Готовность запуска</span>
            <span className="font-mono tabular-nums font-medium text-slate-900">
              {completedSteps}/{totalSteps}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetDefaults}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Сбросить к EN-старту
        </button>
      </div>
    </aside>
  );
}
