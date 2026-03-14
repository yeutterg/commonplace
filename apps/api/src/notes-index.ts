import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { NoteDetailResponse, NoteFrontmatter, NoteSummary } from "@obsidian-comments/shared";
import type { NotesRepository, PublishedNote } from "./contracts.js";
import { renderMarkdown } from "./markdown.js";
import { NoteRegistry } from "./note-registry.js";

interface CachedNote extends PublishedNote {
  absolutePath: string;
  mtimeMs: number;
}

function walkMarkdownFiles(rootDir: string, currentDir = rootDir): string[] {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMarkdownFiles(rootDir, fullPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md") && !entry.name.endsWith(".comments.md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizeSlug(relativePath: string, frontmatter: NoteFrontmatter) {
  if (frontmatter.slug) {
    return frontmatter.slug;
  }

  return relativePath
    .replace(/\.md$/, "")
    .split(path.sep)
    .map((part) => part.toLowerCase().replace(/\s+/g, "-"))
    .join("/");
}

function toSummary(note: CachedNote): NoteSummary {
  return {
    id: note.id,
    slug: note.slug,
    title: note.title,
    path: note.path,
    visibility: note.visibility,
    commentsEnabled: note.commentsEnabled
  };
}

export class FilesystemNotesIndex implements NotesRepository {
  private cache = new Map<string, CachedNote>();
  private indexSignature = "";

  constructor(
    private readonly vaultDir: string,
    private readonly noteRegistry: NoteRegistry
  ) {}

  async listPublishedNotes(): Promise<NoteSummary[]> {
    this.refreshIfStale();
    return [...this.cache.values()].map(toSummary);
  }

  async getPublishedNoteBySlug(slug: string): Promise<PublishedNote | null> {
    this.refreshIfStale();
    const note = this.cache.get(slug);
    return note ?? null;
  }

  async getNoteDetail(slug: string, authorized: boolean): Promise<NoteDetailResponse | null> {
    this.refreshIfStale();
    const note = this.cache.get(slug);
    if (!note) {
      return null;
    }

    const canRead = note.visibility === "public" || authorized;
    return {
      note: toSummary(note),
      authorized: canRead,
      html: canRead ? await renderMarkdown(note.content) : null,
      markdown: canRead ? note.content : null
    };
  }

  private refreshIfStale() {
    if (!fs.existsSync(this.vaultDir)) {
      fs.mkdirSync(this.vaultDir, { recursive: true });
    }

    const { files, signature } = this.readFilesSignature();
    if (signature === this.indexSignature && this.cache.size > 0) {
      return;
    }

    const nextCache = new Map<string, CachedNote>();
    for (const absolutePath of files) {
      const stat = fs.statSync(absolutePath);
      const raw = fs.readFileSync(absolutePath, "utf8");
      const { data, content } = matter(raw);
      const frontmatter = data as NoteFrontmatter;
      if (!frontmatter.publish) {
        continue;
      }

      const relativePath = path.relative(this.vaultDir, absolutePath);
      const slug = normalizeSlug(relativePath, frontmatter);
      const title = frontmatter.title || path.basename(absolutePath, ".md");
      const id = this.noteRegistry.resolveId({
        path: relativePath,
        slug,
        title,
        frontmatterNoteId: frontmatter.noteId
      });

      nextCache.set(slug, {
        id,
        slug,
        title,
        path: relativePath,
        visibility: frontmatter.visibility || "public",
        commentsEnabled: frontmatter.comments !== false,
        passwordHash: frontmatter.password,
        content,
        absolutePath,
        mtimeMs: stat.mtimeMs
      });
    }

    this.cache = nextCache;
    this.indexSignature = signature;
  }

  private readFilesSignature() {
    const files = walkMarkdownFiles(this.vaultDir);
    const signature = files
      .map((file) => {
        const stat = fs.statSync(file);
        return `${path.relative(this.vaultDir, file)}:${stat.mtimeMs}`;
      })
      .sort()
      .join("|");
    return { files, signature };
  }
}
