import { useState, useEffect } from 'react';
import type { Project } from '@/types';
import { X, Save } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';

const EPIC_COLORS = [
  '#8b5cf6',
  '#0ea5e9',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#f97316',
  '#6366f1',
];

interface EpicModalProps {
  project: Project;
  onClose: () => void;
}

export function EpicModal({ project, onClose }: EpicModalProps) {
  const { createEpic } = useProjectStore.getState();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: EPIC_COLORS[0],
  });

  useEffect(() => {
    setFormData({
      name: '',
      description: '',
      color: EPIC_COLORS[project.epics.length % EPIC_COLORS.length],
    });
  }, [project.epics.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createEpic({
      name: formData.name.trim(),
      description: formData.description.trim(),
      color: formData.color,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="dark:bg-dark-card bg-white rounded-xl border dark:border-dark-border max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b dark:border-dark-border">
          <h2 className="text-xl font-semibold">Create Epic</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg motion-press"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Epic Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Core Gameplay Systems"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="What does this epic cover?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex flex-wrap gap-2">
              {EPIC_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg border-2 motion-press ${
                    formData.color === color
                      ? 'border-white dark:border-slate-900 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                      : 'border-transparent hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                  aria-pressed={formData.color === color}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t dark:border-dark-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 motion-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 motion-press flex items-center gap-2"
            >
              <Save size={16} /> Create Epic
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
