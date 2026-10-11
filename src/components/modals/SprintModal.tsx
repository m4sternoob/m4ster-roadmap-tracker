import { useState, useEffect } from 'react';
import type { Project } from '@/types';
import { Save, Calendar } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import {
  ModalShell,
  ModalHeader,
  ModalFooter,
  modalFieldClass,
  modalPrimaryBtn,
  modalGhostBtn,
} from '@/components/ui/ModalShell';

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

  const handleSubmit = (e: React.SyntheticEvent) => {
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
    <ModalShell onClose={onClose} label="Create sprint">
      <ModalHeader title="Create Sprint" onClose={onClose} />
      <div className="space-y-4 px-5 py-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Sprint Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={modalFieldClass}
            placeholder="e.g., Sprint 1 - Foundation"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">Sprint Goal</label>
          <textarea
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            rows={3}
            className={modalFieldClass}
            placeholder="What will be delivered this sprint?"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-300">
              <Calendar size={14} /> Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className={modalFieldClass}
              required
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-300">
              <Calendar size={14} /> End Date
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className={modalFieldClass}
              required
            />
          </div>
        </div>
      </div>
      <ModalFooter>
        <button type="button" onClick={onClose} className={modalGhostBtn}>
          Cancel
        </button>
        <button type="button" onClick={handleSubmit} className={modalPrimaryBtn}>
          <Save size={16} /> Create Sprint
        </button>
      </ModalFooter>
    </ModalShell>
  );
}
