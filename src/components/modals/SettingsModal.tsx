import { useState } from 'react';
import type { Project } from '@/types';
import { X, Download, Upload, Settings, BarChart2, FolderOpen } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';

interface SettingsModalProps {
  project: Project;
  onClose: () => void;
}

export function SettingsModal({ project, onClose }: SettingsModalProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const { exportProject, importProject } = useProjectStore.getState();

  const handleExport = () => {
    exportProject();
    onClose();
  };

  const handleImport = async () => {
    if (!importFile) return;
    try {
      await importProject(importFile);
      onClose();
    } catch (e) {
      alert('Invalid project file');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="dark:bg-dark-card bg-white rounded-xl border dark:border-dark-border max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b dark:border-dark-border">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings size={20} /> Project Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg motion-press"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div>
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <FolderOpen size={18} /> Project Info
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Key</dt>
                <dd className="font-mono font-medium">{project.key}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Name</dt>
                <dd>{project.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Issues</dt>
                <dd>{project.issues.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Epics</dt>
                <dd>{project.epics.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Sprints</dt>
                <dd>{project.sprints.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{new Date(project.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Last Updated</dt>
                <dd>{new Date(project.updatedAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          <div className="border-t dark:border-dark-border pt-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Download size={18} /> Export Project
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Download a JSON backup of your entire project (issues, epics, sprints).
            </p>
            <button
              onClick={handleExport}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 motion-press flex items-center justify-center gap-2"
            >
              <Download size={16} /> Export to JSON
            </button>
          </div>

          <div className="border-t dark:border-dark-border pt-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Upload size={18} /> Import Project
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Restore from a previously exported JSON file.{' '}
              <strong>This will replace all current data.</strong>
            </p>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
            />
            <button
              onClick={handleImport}
              disabled={!importFile}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-inherit hover:bg-slate-200 dark:hover:bg-slate-700 motion-press flex items-center justify-center gap-2"
            >
              <Upload size={16} /> Import from JSON
            </button>
          </div>

          <div className="border-t dark:border-dark-border pt-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <BarChart2 size={18} /> Reports
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              View burndown charts and sprint progress in the Reports view.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
