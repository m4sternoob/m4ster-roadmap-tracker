import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '@/store/projectStore';
import { createSampleProject } from '@/utils/demoData';

beforeEach(() => {
  useProjectStore.setState({ project: createSampleProject() });
});

describe('attachments', () => {
  it('adds an attachment with a generated id and timestamp', () => {
    const { project, addAttachment } = useProjectStore.getState();
    const issueId = project!.issues[0].id;
    addAttachment(issueId, {
      name: 'screenshot.png',
      size: 1024,
      mime: 'image/png',
      url: 'https://example.com/screenshot.png',
    });
    const attachments = useProjectStore.getState().project!.issues[0].attachments;
    expect(attachments).toHaveLength(1);
    expect(attachments[0].name).toBe('screenshot.png');
    expect(attachments[0].id).toBeTruthy();
    expect(attachments[0].uploadedAt).toBeTruthy();
  });

  it('appends to existing attachments and bumps updatedAt', () => {
    const { project, addAttachment } = useProjectStore.getState();
    const issueId = project!.issues[0].id;
    const before = project!.issues[0].updatedAt;
    addAttachment(issueId, { name: 'a.png', size: 1, mime: 'image/png', url: 'u1' });
    addAttachment(issueId, { name: 'b.pdf', size: 2, mime: 'application/pdf', url: 'u2' });
    const issue = useProjectStore.getState().project!.issues[0];
    expect(issue.attachments).toHaveLength(2);
    expect(issue.attachments.map((a) => a.name)).toEqual(['a.png', 'b.pdf']);
    expect(issue.updatedAt >= before).toBe(true);
  });

  it('removes only the named attachment', () => {
    const { project, addAttachment, removeAttachment } = useProjectStore.getState();
    const issueId = project!.issues[0].id;
    addAttachment(issueId, { name: 'a.png', size: 1, mime: 'image/png', url: 'u1' });
    addAttachment(issueId, { name: 'b.png', size: 1, mime: 'image/png', url: 'u2' });
    const id = useProjectStore.getState().project!.issues[0].attachments[0].id;
    removeAttachment(issueId, id);
    const attachments = useProjectStore.getState().project!.issues[0].attachments;
    expect(attachments).toHaveLength(1);
    expect(attachments[0].name).toBe('b.png');
  });

  it('ignores unknown issue ids', () => {
    const { addAttachment, removeAttachment } = useProjectStore.getState();
    const before = JSON.stringify(useProjectStore.getState().project!.issues);
    addAttachment('nope', { name: 'a.png', size: 1, mime: 'image/png', url: 'u1' });
    removeAttachment('nope', 'nope');
    expect(JSON.stringify(useProjectStore.getState().project!.issues)).toBe(before);
  });
});
