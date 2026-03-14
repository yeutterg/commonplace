import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { CommentRecord } from "@obsidian-comments/shared";

export class CommentsStore {
  private readonly db: Database.Database;

  constructor(sqlitePath: string) {
    fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
    this.db = new Database(sqlitePath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS comments (
        note_id TEXT NOT NULL,
        id TEXT NOT NULL,
        status TEXT NOT NULL,
        author_email TEXT NOT NULL,
        body TEXT NOT NULL,
        anchor_text TEXT NOT NULL,
        anchor_start INTEGER NOT NULL,
        anchor_end INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (note_id, id)
      );
      CREATE INDEX IF NOT EXISTS comments_note_id_idx ON comments (note_id);
    `);
  }

  list(noteId: string): CommentRecord[] {
    const stmt = this.db.prepare(`
      SELECT
        id,
        status,
        author_email as authorEmail,
        body,
        anchor_text as anchorText,
        anchor_start as anchorStart,
        anchor_end as anchorEnd,
        created_at as createdAt,
        updated_at as updatedAt
      FROM comments
      WHERE note_id = ?
      ORDER BY anchor_start ASC, created_at ASC
    `);
    return stmt.all(noteId) as CommentRecord[];
  }

  add(
    noteId: string,
    input: Omit<CommentRecord, "id" | "status" | "createdAt" | "updatedAt">
  ): CommentRecord {
    const now = new Date().toISOString();
    const id = this.nextId(noteId, now);
    const comment: CommentRecord = {
      id,
      status: "open",
      authorEmail: input.authorEmail,
      body: input.body,
      anchorText: input.anchorText,
      anchorStart: input.anchorStart,
      anchorEnd: input.anchorEnd,
      createdAt: now,
      updatedAt: now
    };

    this.db
      .prepare(`
        INSERT INTO comments (
          note_id, id, status, author_email, body, anchor_text, anchor_start, anchor_end, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        noteId,
        comment.id,
        comment.status,
        comment.authorEmail,
        comment.body,
        comment.anchorText,
        comment.anchorStart,
        comment.anchorEnd,
        comment.createdAt,
        comment.updatedAt
      );

    return comment;
  }

  updateStatus(noteId: string, id: string, status: "open" | "resolved"): CommentRecord | null {
    const existing = this.find(noteId, id);
    if (!existing) {
      return null;
    }

    const updatedAt = new Date().toISOString();
    this.db
      .prepare("UPDATE comments SET status = ?, updated_at = ? WHERE note_id = ? AND id = ?")
      .run(status, updatedAt, noteId, id);

    return { ...existing, status, updatedAt };
  }

  delete(noteId: string, id: string): boolean {
    const result = this.db
      .prepare("DELETE FROM comments WHERE note_id = ? AND id = ?")
      .run(noteId, id);
    return result.changes > 0;
  }

  private find(noteId: string, id: string): CommentRecord | null {
    const row = this.db
      .prepare(`
        SELECT
          id,
          status,
          author_email as authorEmail,
          body,
          anchor_text as anchorText,
          anchor_start as anchorStart,
          anchor_end as anchorEnd,
          created_at as createdAt,
          updated_at as updatedAt
        FROM comments
        WHERE note_id = ? AND id = ?
      `)
      .get(noteId, id);
    return (row as CommentRecord | undefined) ?? null;
  }

  private nextId(noteId: string, isoDate: string) {
    const date = isoDate.slice(0, 10);
    const pattern = `CMT-${date}-%`;
    const row = this.db
      .prepare("SELECT id FROM comments WHERE note_id = ? AND id LIKE ? ORDER BY id DESC LIMIT 1")
      .get(noteId, pattern) as { id?: string } | undefined;
    const nextIndex = row?.id ? Number.parseInt(row.id.slice(-3), 10) + 1 : 1;
    return `CMT-${date}-${String(nextIndex).padStart(3, "0")}`;
  }
}
