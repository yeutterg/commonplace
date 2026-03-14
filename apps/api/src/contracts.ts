import type { CommentRecord, NoteDetailResponse, NoteSummary } from "@obsidian-comments/shared";

export interface PublishedNote extends NoteSummary {
  passwordHash?: string;
  content: string;
}

export interface NotesRepository {
  listPublishedNotes(): Promise<NoteSummary[]>;
  getPublishedNoteBySlug(slug: string): Promise<PublishedNote | null>;
  getNoteDetail(slug: string, authorized: boolean): Promise<NoteDetailResponse | null>;
}

export interface CommentsRepository {
  list(noteId: string): CommentRecord[];
  add(
    noteId: string,
    input: Omit<CommentRecord, "id" | "status" | "createdAt" | "updatedAt">
  ): CommentRecord;
  updateStatus(noteId: string, id: string, status: "open" | "resolved"): CommentRecord | null;
  delete(noteId: string, id: string): boolean;
}
