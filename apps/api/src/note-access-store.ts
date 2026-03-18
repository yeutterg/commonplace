import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

export class NoteAccessStore {
  private db: Database.Database;

  constructor(sqlitePath: string) {
    const dir = path.dirname(sqlitePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(sqlitePath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS note_access (
        note_slug TEXT NOT NULL,
        email TEXT NOT NULL,
        added_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (note_slug, email)
      );
      CREATE INDEX IF NOT EXISTS idx_note_access_slug ON note_access(note_slug);
      CREATE INDEX IF NOT EXISTS idx_note_access_email ON note_access(email);
    `);
  }

  getAllowedEmails(slug: string): string[] {
    const rows = this.db
      .prepare("SELECT email FROM note_access WHERE note_slug = ? ORDER BY email")
      .all(slug) as { email: string }[];
    return rows.map((r) => r.email);
  }

  setAllowedEmails(slug: string, emails: string[]): void {
    const tx = this.db.transaction(() => {
      this.db.prepare("DELETE FROM note_access WHERE note_slug = ?").run(slug);
      const insert = this.db.prepare(
        "INSERT INTO note_access (note_slug, email) VALUES (?, ?)"
      );
      for (const email of emails) {
        insert.run(slug, email.toLowerCase().trim());
      }
    });
    tx();
  }

  addEmail(slug: string, email: string): void {
    this.db
      .prepare(
        "INSERT OR IGNORE INTO note_access (note_slug, email) VALUES (?, ?)"
      )
      .run(slug, email.toLowerCase().trim());
  }

  removeEmail(slug: string, email: string): void {
    this.db
      .prepare("DELETE FROM note_access WHERE note_slug = ? AND email = ?")
      .run(slug, email.toLowerCase().trim());
  }

  hasAccess(slug: string, email: string): boolean {
    const row = this.db
      .prepare(
        "SELECT 1 FROM note_access WHERE note_slug = ? AND email = ? LIMIT 1"
      )
      .get(slug, email.toLowerCase().trim());
    return !!row;
  }

  getSlugsForEmail(email: string): string[] {
    const rows = this.db
      .prepare("SELECT note_slug FROM note_access WHERE email = ?")
      .all(email.toLowerCase().trim()) as { note_slug: string }[];
    return rows.map((r) => r.note_slug);
  }
}
