/**
 * Notes Service
 * Manages saving, retrieving, and organizing student study notes in browser local storage.
 */

import { NoteSummary } from '../types';

const STORAGE_KEY = 'studypilot_notes';

export const notesService = {
  /**
   * Retrieves all saved notes from browser local storage.
   */
  getNotes(): NoteSummary[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Saves a new note summary.
   */
  saveNote(note: NoteSummary): NoteSummary[] {
    const notes = this.getNotes();
    const updated = [note, ...notes.filter((n) => n.id !== note.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  /**
   * Finds a note by its unique identifier.
   */
  getNoteById(id: string): NoteSummary | undefined {
    return this.getNotes().find((n) => n.id === id);
  },

  /**
   * Deletes a note by its ID.
   */
  deleteNote(id: string): NoteSummary[] {
    const notes = this.getNotes().filter((n) => n.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return notes;
  },
};
