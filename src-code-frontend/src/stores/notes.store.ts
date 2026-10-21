import { map } from 'nanostores';

export type NoteTag = 'blocker' | 'bug' | 'suggestion' | 'question' | 'nitpick' | 'praise';

export interface LineNote {
  id: string; // Canonical key: {platform}_{projectPath}_{pullNumber}_{filePath}_{lineNumber}
  platform: 'github' | 'gitlab';
  projectPath: string; // e.g. "owner/repo" or "group/subgroup/project"
  pullNumber: string;
  filePath: string;
  lineNumber: number;
  content: string; // Raw markdown text
  isCollapsed: boolean;
  createdAt: number;
  updatedAt: number;
  promoted?: boolean;
  tag?: NoteTag;
}

export function buildNoteKey(
  platform: string,
  projectPath: string,
  pullNumber: string,
  filePath: string,
  lineNumber: number
): string {
  const normProject = projectPath.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const normFile = filePath.trim().replace(/[^a-zA-Z0-9_.-]/g, '_');
  return `${platform}_${normProject}_${pullNumber}_${normFile}_${lineNumber}`;
}

export const $activeNotes = map<Record<string, LineNote>>({});

export function setNoteInStore(note: LineNote) {
  $activeNotes.setKey(note.id, note);
}

export function removeNoteFromStore(noteId: string) {
  const current = { ...$activeNotes.get() };
  delete current[noteId];
  $activeNotes.set(current);
}

export function clearActiveNotes() {
  $activeNotes.set({});
}
