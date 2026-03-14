export type NoteVisibility = "public" | "password_protected";

export interface NoteFrontmatter {
  noteId?: string;
  title?: string;
  publish?: boolean;
  visibility?: NoteVisibility;
  comments?: boolean;
  slug?: string;
  password?: string;
}

export interface NoteSummary {
  id: string;
  slug: string;
  title: string;
  path: string;
  visibility: NoteVisibility;
  commentsEnabled: boolean;
}

export interface NoteDetailResponse {
  note: NoteSummary;
  authorized: boolean;
  html: string | null;
  markdown: string | null;
}

export interface CommentRecord {
  id: string;
  status: "open" | "resolved";
  authorEmail: string;
  body: string;
  anchorText: string;
  anchorStart: number;
  anchorEnd: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionResponse {
  email: string | null;
  authenticatedSlugs: string[];
  expiresAt: string | null;
}

export interface SystemCapabilities {
  mode: "filesystem-vault";
  realtime: boolean;
  sync: {
    source: "vault";
    writable: boolean;
  };
}
