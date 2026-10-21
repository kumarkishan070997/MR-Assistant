import { LineNote, $activeNotes, setNoteInStore, removeNoteFromStore } from '../stores/notes.store';

const STORAGE_KEY = 'review_sessions';

export class StorageService {
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private defaultDebounceMs = 300;

  private isChromeStorageAvailable(): boolean {
    return Boolean(
      typeof globalThis.chrome !== 'undefined' &&
      globalThis.chrome.storage &&
      globalThis.chrome.storage.local
    );
  }

  public async getAllNotes(): Promise<Record<string, LineNote>> {
    if (!this.isChromeStorageAvailable()) {
      return $activeNotes.get();
    }

    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const stored = (result[STORAGE_KEY] as Record<string, LineNote>) || {};
        resolve(stored);
      });
    });
  }

  public async loadNotesForReview(
    platform: string,
    projectPath: string,
    pullNumber: string
  ): Promise<Record<string, LineNote>> {
    const all = await this.getAllNotes();
    const prefix = `${platform}_${projectPath.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}_${pullNumber}_`;

    const filtered: Record<string, LineNote> = {};
    for (const [key, note] of Object.entries(all)) {
      if (
        (key.startsWith(prefix) ||
          (note.platform === platform && note.projectPath === projectPath && note.pullNumber === pullNumber)) &&
        note &&
        typeof note.content === 'string' &&
        note.content.trim().length > 0
      ) {
        filtered[key] = note;
      }
    }

    $activeNotes.set(filtered);
    return filtered;
  }

  public async saveNoteImmediate(note: LineNote): Promise<void> {
    if (!note.content || !note.content.trim()) {
      await this.deleteNote(note.id);
      return;
    }

    // Clear any pending debounce timer for this note
    if (this.debounceTimers.has(note.id)) {
      clearTimeout(this.debounceTimers.get(note.id));
      this.debounceTimers.delete(note.id);
    }

    // Update in-memory atom immediately
    setNoteInStore(note);

    if (!this.isChromeStorageAvailable()) {
      return;
    }

    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (res) => {
        const sessions = (res[STORAGE_KEY] as Record<string, LineNote>) || {};
        sessions[note.id] = note;
        chrome.storage.local.set({ [STORAGE_KEY]: sessions }, () => {
          resolve();
        });
      });
    });
  }

  public saveNoteDebounced(
    note: LineNote,
    debounceMs: number = this.defaultDebounceMs
  ): Promise<void> {
    if (!note.content || !note.content.trim()) {
      return this.deleteNote(note.id);
    }

    // Update memory store immediately for snappy UI
    setNoteInStore(note);

    if (this.debounceTimers.has(note.id)) {
      clearTimeout(this.debounceTimers.get(note.id));
    }

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(note.id);
        await this.saveNoteImmediate(note);
        resolve();
      }, debounceMs);

      this.debounceTimers.set(note.id, timer);
    });
  }

  public async deleteNote(noteId: string): Promise<void> {
    if (this.debounceTimers.has(noteId)) {
      clearTimeout(this.debounceTimers.get(noteId));
      this.debounceTimers.delete(noteId);
    }

    removeNoteFromStore(noteId);

    if (!this.isChromeStorageAvailable()) {
      return;
    }

    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (res) => {
        const sessions = (res[STORAGE_KEY] as Record<string, LineNote>) || {};
        delete sessions[noteId];
        chrome.storage.local.set({ [STORAGE_KEY]: sessions }, () => {
          resolve();
        });
      });
    });
  }

  public flushPending(): void {
    for (const [, timer] of this.debounceTimers) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }
}

export const globalStorageService = new StorageService();
