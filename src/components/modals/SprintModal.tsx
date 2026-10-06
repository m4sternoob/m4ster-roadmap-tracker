import { useState, useEffect } from 'react';
import type { Project } from '@/types';
import { X, Save, Calendar } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';

interface SprintModalProps {
  project: Project;
  onClose: () => void;
}

export function SprintModal({ project, onClose }: SprintModalProps) {
  const { createSprint } = useProjectStore.getState();
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    setFormData({
      name: `Sprint ${project.sprints.length + 1}`,
      goal: '',
      startDate: fmt(today),
      endDate: fmt(nextWeek),
    });
  }, [project.sprints.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    createSprint({
      name: formData.name.trim(),
      goal: formData.goal.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="dark:bg-dark-card bg-white rounded-xl border dark:border-dark-border max-w-md w-full animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b dark:border-dark-border">
          <h2 className="text-xl font-semibold">Create Sprint</h2>
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
            <label className="block text-sm font-medium mb-1">Sprint Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Sprint 1 - Foundation"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sprint Goal</label>
            <textarea
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="What will be delivered this sprint?"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Calendar size={14} /> Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Calendar size={14} /> End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border dark:border-dark-border dark:bg-dark-bg bg-white text-inherit focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
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
              <Save size={16} /> Create Sprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
