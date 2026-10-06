import { useState } from 'react';
import type { Project } from '@/types';
import { Download, Upload, Settings, BarChart2, FolderOpen, Database, Trash2 } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { ModalShell, ModalHeader, modalPrimaryBtn } from '@/components/ui/ModalShell';

interface SettingsModalProps {
  project: Project;
  onClose: () => void;
}

export function SettingsModal({ project, onClose }: SettingsModalProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const { exportProject, importProject, loadSampleData, clearWorkspace, setShowConfirmDialog } =
    useProjectStore.getState();

  const handleExport = () => {
    exportProject();
    onClose();
  };

  const handleImport = async () => {
    if (!importFile) return;
    try {
      await importProject(importFile);
      onClose();
    } catch {
      alert('Invalid project file');
    }
  };

  return (
    <ModalShell
      onClose={onClose}
      label="Project settings"
      panel="max-w-lg w-full rounded-xl border border-white/10 bg-[#1c1f26] text-slate-100 shadow-2xl shadow-black/50 animate-scale-in max-h-[90vh] overflow-y-auto"
    >
      <ModalHeader
        title="Project Settings"
        onClose={onClose}
        icon={<Settings size={20} className="text-slate-400" />}
      />

      <div className="space-y-6 px-5 py-4">
        <section>
          <h3 className="mb-3 flex items-center gap-2 font-medium text-slate-200">
            <FolderOpen size={18} className="text-slate-400" /> Project Info
          </h3>
          <dl className="space-y-2 text-sm">
            {(
              [
                [
                  'Key',
                  <span key="k" className="font-mono font-medium">
                    {project.key}
                  </span>,
                ],
                ['Name', project.name],
                ['Issues', project.issues.length],
                ['Epics', project.epics.length],
                ['Sprints', project.sprints.length],
                ['Created', new Date(project.createdAt).toLocaleDateString()],
                ['Last Updated', new Date(project.updatedAt).toLocaleDateString()],
              ] as const
            ).map(([term, value]) => (
              <div key={term} className="flex justify-between">
                <dt className="text-slate-400">{term}</dt>
                <dd className="text-slate-200">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-t border-white/10 pt-4">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-slate-200">
            <Download size={18} className="text-slate-400" /> Export Project
          </h3>
          <p className="mb-3 text-sm text-slate-400">
            Download a JSON backup of your entire project (issues, epics, sprints).
          </p>
          <button onClick={handleExport} className={`${modalPrimaryBtn} w-full justify-center`}>
            <Download size={16} /> Export to JSON
          </button>
        </section>

        <section className="border-t border-white/10 pt-4">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-slate-200">
            <Upload size={18} className="text-slate-400" /> Import Project
          </h3>
          <p className="mb-3 text-sm text-slate-400">
            Restore from a previously exported JSON file.{' '}
            <strong className="text-slate-200">This will replace all current data.</strong>
          </p>
          <input
            type="file"
            accept=".json"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            className="mb-3 w-full rounded-lg border border-white/10 bg-[#0f1115] px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-sm file:text-slate-200 focus:outline-none"
          />
          <button
            onClick={handleImport}
            disabled={!importFile}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/15 motion-press disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Upload size={16} /> Import from JSON
          </button>
        </section>

        <section className="border-t border-white/10 pt-4">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-slate-200">
            <Database size={18} className="text-slate-400" /> Sample Data
          </h3>
          <p className="mb-3 text-sm text-slate-400">
            Load a sample workspace to explore the UI, or wipe everything and start empty.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                loadSampleData();
                onClose();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/15 motion-press"
            >
              <Database size={16} /> Load sample dataset
            </button>
            <button
              onClick={() =>
                setShowConfirmDialog({
                  title: 'Reset workspace?',
                  message: 'This deletes all issues, epics and sprints. This cannot be undone.',
                  onConfirm: () => {
                    clearWorkspace();
                    onClose();
                  },
                })
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 motion-press"
            >
              <Trash2 size={16} /> Reset workspace
            </button>
          </div>
        </section>

        <section className="border-t border-white/10 pt-4">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-slate-200">
            <BarChart2 size={18} className="text-slate-400" /> Reports
          </h3>
          <p className="text-sm text-slate-400">
            View burndown charts and sprint progress in the Reports view.
          </p>
        </section>
      </div>
    </ModalShell>
  );
}
