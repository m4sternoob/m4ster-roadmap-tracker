import { describe, it, expect } from 'vitest';
import {
  generateIssueKey,
  generateEpicKey,
  formatDate,
  isOverdue,
  initials,
  getEpicProgress,
} from '@/utils/helpers';

describe('helpers', () => {
  describe('generateIssueKey', () => {
    it('generates correct issue key', () => {
      const project = {
        key: 'MT',
        nextIssueNumber: 1,
      } as any;
      expect(generateIssueKey(project)).toBe('MT-1');
    });

    it('increments with nextIssueNumber', () => {
      const project = {
        key: 'RT',
        nextIssueNumber: 42,
      } as any;
      expect(generateIssueKey(project)).toBe('RT-42');
    });
  });

  describe('generateEpicKey', () => {
    it('generates correct epic key', () => {
      const project = {
        key: 'MT',
        epics: [],
      } as any;
      expect(generateEpicKey(project)).toBe('MT-E1');
    });

    it('increments with epic count', () => {
      const project = {
        key: 'MT',
        epics: [{}, {}, {}],
      } as any;
      expect(generateEpicKey(project)).toBe('MT-E4');
    });
  });

  describe('formatDate', () => {
    it('formats ISO date string', () => {
      const result = formatDate('2024-01-15T10:30:00Z');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });
  });

  describe('isOverdue', () => {
    it('returns false for future date', () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      expect(isOverdue(future)).toBe(false);
    });

    it('returns true for past date', () => {
      const past = new Date(Date.now() - 86400000).toISOString();
      expect(isOverdue(past)).toBe(true);
    });

    it('returns false for undefined', () => {
      expect(isOverdue(undefined)).toBe(false);
    });
  });

  describe('initials', () => {
    it('extracts initials from full name', () => {
      expect(initials('John Doe')).toBe('JD');
      expect(initials('Alice')).toBe('A');
      expect(initials('  Bob  Smith  ')).toBe('BS');
    });

    it('handles multiple spaces', () => {
      expect(initials('John  Middle  Doe')).toBe('JM');
    });
  });

  describe('getEpicProgress', () => {
    const project = {
      issues: [
        { id: 'i1', epicId: 'e1', status: 'done', storyPoints: 3 },
        { id: 'i2', epicId: 'e1', status: 'done', storyPoints: 5 },
        { id: 'i3', epicId: 'e1', status: 'in-progress', storyPoints: 2 },
        { id: 'i4', epicId: 'e1', status: 'todo', storyPoints: 4 },
        { id: 'i5', epicId: 'e2', status: 'done', storyPoints: 1 },
        { id: 'i6', status: 'done', storyPoints: 8 },
      ],
    } as any;

    it('counts issues and story points per epic', () => {
      const p = getEpicProgress(project, 'e1');
      expect(p.totalIssues).toBe(4);
      expect(p.doneIssues).toBe(2);
      expect(p.percentComplete).toBe(50);
      expect(p.totalPoints).toBe(14);
      expect(p.donePoints).toBe(8);
      expect(p.pointsPercent).toBe(57);
    });

    it('builds a per-status breakdown', () => {
      const p = getEpicProgress(project, 'e1');
      expect(p.statusBreakdown.done).toBe(2);
      expect(p.statusBreakdown['in-progress']).toBe(1);
      expect(p.statusBreakdown.todo).toBe(1);
      expect(p.statusBreakdown.backlog).toBe(0);
    });

    it('ignores issues from other epics or none', () => {
      const p = getEpicProgress(project, 'e2');
      expect(p.totalIssues).toBe(1);
      expect(p.percentComplete).toBe(100);
    });

    it('handles epics with no issues', () => {
      const p = getEpicProgress(project, 'e3');
      expect(p.totalIssues).toBe(0);
      expect(p.percentComplete).toBe(0);
      expect(p.pointsPercent).toBe(0);
      expect(p.totalPoints).toBe(0);
    });
  });
});
