import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";

export class NoteRegistry {
  private readonly db: Database.Database;

  constructor(sqlitePath: string) {
    fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
    this.db = new Database(sqlitePath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS note_registry (
        note_id TEXT PRIMARY KEY,
        note_path TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS note_registry_slug_idx ON note_registry (slug);
    `);
  }

  resolveId(input: {
    path: string;
    slug: string;
    title: string;
    frontmatterNoteId?: string;
  }): string {
    const now = new Date().toISOString();

    if (input.frontmatterNoteId) {
      const existing = this.db
        .prepare("SELECT note_id FROM note_registry WHERE note_id = ?")
        .get(input.frontmatterNoteId) as { note_id?: string } | undefined;

      if (existing?.note_id) {
        this.update(input.frontmatterNoteId, input.path, input.slug, input.title, now);
        return input.frontmatterNoteId;
      }

      this.insert(input.frontmatterNoteId, input.path, input.slug, input.title, now);
      return input.frontmatterNoteId;
    }

    const byPath = this.db
      .prepare("SELECT note_id FROM note_registry WHERE note_path = ?")
      .get(input.path) as { note_id?: string } | undefined;
    if (byPath?.note_id) {
      this.update(byPath.note_id, input.path, input.slug, input.title, now);
      return byPath.note_id;
    }

    const bySlug = this.db
      .prepare("SELECT note_id FROM note_registry WHERE slug = ? ORDER BY updated_at DESC LIMIT 1")
      .get(input.slug) as { note_id?: string } | undefined;
    if (bySlug?.note_id) {
      this.update(bySlug.note_id, input.path, input.slug, input.title, now);
      return bySlug.note_id;
    }

    const noteId = crypto.randomUUID();
    this.insert(noteId, input.path, input.slug, input.title, now);
    return noteId;
  }

  private insert(noteId: string, notePath: string, slug: string, title: string, now: string) {
    this.db
      .prepare(`
        INSERT INTO note_registry (note_id, note_path, slug, title, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(noteId, notePath, slug, title, now, now);
  }

  private update(noteId: string, notePath: string, slug: string, title: string, now: string) {
    this.db
      .prepare(`
        INSERT INTO note_registry (note_id, note_path, slug, title, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(note_id) DO UPDATE SET
          note_path = excluded.note_path,
          slug = excluded.slug,
          title = excluded.title,
          updated_at = excluded.updated_at
      `)
      .run(noteId, notePath, slug, title, now, now);
  }
}
