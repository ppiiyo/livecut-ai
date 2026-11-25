import { useMemo, useState } from 'react';
import { Copy, Check, Download, FileArchive, AlertCircle } from 'lucide-react';
import { PipelineState } from '../types/pipeline';
import {
  generateConfigToml,
  generateEnvFile,
  generatePatchScript,
  generateReadme,
  generateSetupGuide
} from '../utils/generator';
import { validatePipelineForExport } from '../utils/validation';
import { createZipBlob } from '../utils/zip';

interface ExportViewProps {
  state: PipelineState;
}

type ArtifactKey = 'patch' | 'config' | 'env' | 'setup' | 'readme';

export function ExportView({ state }: ExportViewProps) {
  const [selectedFile, setSelectedFile] = useState<ArtifactKey>('patch');
  const [includeEnvSecrets, setIncludeEnvSecrets] = useState(false);
  const [copiedFile, setCopiedFile] = useState(false);

  const validation = useMemo(() => validatePipelineForExport(state), [state]);

  const files = useMemo<Record<ArtifactKey, { filename: string; subtitle: string; content: string }>>(
    () => ({
      patch: {
        filename: 'apply_en_patch.py',
        subtitle: 'Самодостаточный патч-скрипт (Python 3.10+, бэкапы и AST/TOML-проверка)',
        content: generatePatchScript(state)
      },
      config: {
        filename: 'config.toml',
        subtitle: 'Актуальный конфиг каналов, детектора и бюджета',
        content: generateConfigToml(state)
      },
      env: {
        filename: includeEnvSecrets ? '.env' : '.env.example',
        subtitle: includeEnvSecrets ? 'Файл окружения с введёнными ключами' : 'Безопасный шаблон без секретов',
        content: generateEnvFile(state, includeEnvSecrets)
      },
      setup: {
        filename: 'SETUP_RU.md',
        subtitle: 'Пошаговая инструкция по установке и калибровке на Windows',
        content: generateSetupGuide(state)
      },
      readme: {
        filename: 'README.md',
        subtitle: 'Описание форка для вашего GitHub-репозитория',
        content: generateReadme(state)
      }
    }),
    [state, includeEnvSecrets]
  );

  const active = files[selectedFile];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(active.content);
      setCopiedFile(true);
      setTimeout(() => setCopiedFile(false), 1800);
    } catch {
      setCopiedFile(false);
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSingle = () => {
    if (!validation.valid) return;
    const blob = new Blob([active.content], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, active.filename);
  };

  const handleDownloadZip = () => {
    if (!validation.valid) return;
    const zipBlob = createZipBlob([
      { name: 'apply_en_patch.py', content: files.patch.content },
      { name: 'config.toml', content: files.config.content },
      { name: includeEnvSecrets ? '.env' : '.env.example', content: files.env.content },
      { name: 'SETUP_RU.md', content: files.setup.content },
      { name: 'README.md', content: files.readme.content }
    ]);
    triggerDownload(zipBlob, `${state.repo.repoName || 'livecut-en'}-kit.zip`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            01. Сборка и экспорт готового пакета
          </h2>
          <p className="text-sm text-slate-500">
            Все файлы генерируются в реальном времени из ваших настроек каналов, промпта, хэштегов и бюджета.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeEnvSecrets}
              onChange={(e) => setIncludeEnvSecrets(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <span>Включить введённые ключи в .env</span>
          </label>
          <button
            type="button"
            disabled={!validation.valid}
            onClick={handleDownloadZip}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
          >
            <FileArchive className="w-4 h-4" aria-hidden="true" />
            Скачать пакет (.zip)
          </button>
        </div>
      </div>

      {!validation.valid && (
        <div
          role="alert"
          className="p-4 rounded-lg border border-red-300 bg-red-50 text-red-900 text-sm space-y-1.5"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0" aria-hidden="true" />
            <span>Экспорт заблокирован: исправьте ошибки валидации</span>
          </div>
          <ul className="list-disc pl-5 text-xs space-y-0.5">
            {validation.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg divide-y divide-slate-200 overflow-hidden">
          {(Object.keys(files) as ArtifactKey[]).map((key) => {
            const item = files[key];
            const isSelected = selectedFile === key;
            const lines = item.content.split('\n').length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedFile(key)}
                className={`w-full p-4 text-left ${
                  isSelected ? 'bg-slate-900 text-white' : 'bg-white text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-mono font-semibold">{item.filename}</span>
                  <span className={`text-xs font-mono tabular-nums ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {lines} стр.
                  </span>
                </div>
                <div className={`mt-1 text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {item.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900">
            <div>
              <div className="text-sm font-mono font-semibold text-white">{active.filename}</div>
              <div className="text-xs text-slate-400">{active.subtitle}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap"
              >
                {copiedFile ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copiedFile ? 'Скопировано' : 'Копировать'}
              </button>
              <button
                type="button"
                disabled={!validation.valid}
                onClick={handleDownloadSingle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Скачать файл
              </button>
            </div>
          </div>

          <pre className="p-4 text-xs font-mono text-slate-100 overflow-x-auto max-h-[620px] leading-relaxed">
            <code>{active.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
