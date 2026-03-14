import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import type { Server } from "node:http";
import { apiConfig } from "./config.js";
import { CommentsStore } from "./comments-store.js";
import { NoteRegistry } from "./note-registry.js";
import { FilesystemNotesIndex } from "./notes-index.js";
import { readSession, writeSession } from "./session.js";
import type { SystemCapabilities } from "@obsidian-comments/shared";
import {
  authRequestSchema,
  createCommentSchema,
  updateCommentSchema
} from "./schemas.js";

const app = express();
const noteRegistry = new NoteRegistry(apiConfig.sqlitePath);
const notesRepository = new FilesystemNotesIndex(apiConfig.vaultDir, noteRegistry);
const commentsStore = new CommentsStore(apiConfig.sqlitePath);
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  entry.count += 1;
  return entry.count <= 20;
}

function noteAccess(slug: string, req: express.Request) {
  const session = readSession(req);
  return session.authenticatedSlugs.includes(slug);
}

app.use(cors({
  origin: apiConfig.corsOrigin,
  credentials: true
}));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/system/capabilities", (_req, res) => {
  const capabilities: SystemCapabilities = {
    mode: "filesystem-vault",
    realtime: false,
    sync: {
      source: "vault",
      writable: true
    }
  };
  res.json(capabilities);
});

app.get("/api/notes", async (_req, res) => {
  res.json({ notes: await notesRepository.listPublishedNotes() });
});

app.get("/api/notes/:slug", async (req, res) => {
  const detail = await notesRepository.getNoteDetail(req.params.slug, noteAccess(req.params.slug, req));
  if (!detail) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json(detail);
});

app.get("/api/auth", (req, res) => {
  const session = readSession(req);
  res.json(session);
});

app.post("/api/auth", async (req, res) => {
  const parsed = authRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid authentication request" });
    return;
  }
  const { slug, password, email } = parsed.data;

  const note = await notesRepository.getPublishedNoteBySlug(slug);
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  if (note.visibility !== "password_protected") {
    res.status(400).json({ error: "Page is not password protected" });
    return;
  }

  if (!note.passwordHash || hashPassword(password) !== note.passwordHash) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  const session = readSession(req);
  writeSession(res, {
    email,
    authenticatedSlugs: Array.from(new Set([...session.authenticatedSlugs, slug]))
  });

  res.json({ success: true });
});

app.get("/api/notes/:slug/comments", async (req, res) => {
  const detail = await notesRepository.getNoteDetail(req.params.slug, noteAccess(req.params.slug, req));
  if (!detail) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  if (!detail.note.commentsEnabled) {
    res.status(403).json({ error: "Comments are disabled" });
    return;
  }

  if (!detail.authorized) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json({ comments: commentsStore.list(detail.note.id) });
});

app.post("/api/notes/:slug/comments", async (req, res) => {
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: "Rate limited" });
    return;
  }

  const detail = await notesRepository.getNoteDetail(req.params.slug, noteAccess(req.params.slug, req));
  if (!detail) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  if (!detail.note.commentsEnabled) {
    res.status(403).json({ error: "Comments are disabled" });
    return;
  }

  if (!detail.authorized) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = createCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid comment payload" });
    return;
  }

  if (parsed.data.honeypot) {
    res.json({ success: true });
    return;
  }

  const comment = commentsStore.add(detail.note.id, {
    authorEmail: parsed.data.authorEmail,
    body: parsed.data.body.replace(/<[^>]*>/g, ""),
    anchorText: parsed.data.anchorText,
    anchorStart: parsed.data.anchorStart,
    anchorEnd: parsed.data.anchorEnd
  });

  res.status(201).json({ comment });
});

app.patch("/api/notes/:slug/comments/:commentId", async (req, res) => {
  const detail = await notesRepository.getNoteDetail(req.params.slug, noteAccess(req.params.slug, req));
  if (!detail) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  if (!detail.note.commentsEnabled) {
    res.status(403).json({ error: "Comments are disabled" });
    return;
  }

  if (!detail.authorized) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = updateCommentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const comment = commentsStore.updateStatus(detail.note.id, req.params.commentId, parsed.data.status);
  if (!comment) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }

  res.json({ comment });
});

app.delete("/api/notes/:slug/comments/:commentId", async (req, res) => {
  const detail = await notesRepository.getNoteDetail(req.params.slug, noteAccess(req.params.slug, req));
  if (!detail) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  if (!detail.note.commentsEnabled) {
    res.status(403).json({ error: "Comments are disabled" });
    return;
  }

  if (!detail.authorized) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const deleted = commentsStore.delete(detail.note.id, req.params.commentId);
  if (!deleted) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }

  res.json({ success: true });
});

const server = app.listen(apiConfig.port, () => {
  console.log(`API listening on http://localhost:${apiConfig.port}`);
});

attachRealtimeStub(server);

function attachRealtimeStub(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({
      type: "capabilities",
      realtime: false,
      message: "Realtime editing is planned but not implemented in this initial architecture."
    }));
  });
}
