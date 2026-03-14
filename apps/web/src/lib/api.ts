import "server-only";
import { headers } from "next/headers";
import type {
  NoteDetailResponse,
  NoteSummary,
  SessionResponse,
  CommentRecord
} from "@obsidian-comments/shared";
import { getServerApiBaseUrl } from "./api-base";

export async function fetchNotes(): Promise<NoteSummary[]> {
  const response = await fetch(`${getServerApiBaseUrl()}/api/notes`, {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("Failed to fetch notes");
  }

  const data = await response.json() as { notes: NoteSummary[] };
  return data.notes;
}

export async function fetchNoteDetail(slug: string): Promise<NoteDetailResponse> {
  const incomingHeaders = await headers();
  const response = await fetch(`${getServerApiBaseUrl()}/api/notes/${slug}`, {
    cache: "no-store",
    headers: {
      cookie: incomingHeaders.get("cookie") ?? ""
    }
  });

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch note");
  }

  return response.json() as Promise<NoteDetailResponse>;
}

export async function fetchSession(): Promise<SessionResponse> {
  const incomingHeaders = await headers();
  const response = await fetch(`${getServerApiBaseUrl()}/api/auth`, {
    cache: "no-store",
    headers: {
      cookie: incomingHeaders.get("cookie") ?? ""
    }
  });
  return response.json() as Promise<SessionResponse>;
}

export type { NoteDetailResponse, NoteSummary, SessionResponse, CommentRecord };
