import { useState, useEffect } from 'react';
import type { Project } from '@/types';
import { Save } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import {
  ModalShell,
  ModalHeader,
  ModalFooter,
  modalFieldClass,
  modalPrimaryBtn,
  modalGhostBtn,
} from '@/components/ui/ModalShell';

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

  const handleSubmit = (e: React.SyntheticEvent) => {
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
    <ModalShell onClose={onClose} label="Create epic">
      <ModalHeader title="Create Epic" onClose={onClose} />
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Epic Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={modalFieldClass}
            placeholder="e.g., Core Gameplay Systems"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className={modalFieldClass}
            placeholder="What does this epic cover?"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Color</label>
          <div className="flex flex-wrap gap-2">
            {EPIC_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`h-10 w-10 rounded-lg border-2 motion-press ${
                  formData.color === color
                    ? 'border-white ring-2 ring-white/40'
                    : 'border-transparent hover:ring-2 hover:ring-white/30'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Color ${color}`}
                aria-pressed={formData.color === color}
              />
            ))}
          </div>
        </div>
      </form>
      <ModalFooter>
        <button type="button" onClick={onClose} className={modalGhostBtn}>
          Cancel
        </button>
        <button type="submit" onClick={handleSubmit} className={modalPrimaryBtn}>
          <Save size={16} /> Create Epic
        </button>
      </ModalFooter>
    </ModalShell>
  );
}
