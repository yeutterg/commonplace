"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NoteDetailResponse } from "@obsidian-comments/shared";
import NoteViewer from "@/components/NoteViewer";
import LoginForm from "@/components/LoginForm";
import ThemeToggle from "@/components/ThemeToggle";
import { getClientApiBaseUrl } from "@/lib/api-base";

async function fetchNoteDetail(slug: string): Promise<NoteDetailResponse> {
  const response = await fetch(`${getClientApiBaseUrl()}/api/notes/${slug}`, {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Failed to fetch note");
  }

  return response.json() as Promise<NoteDetailResponse>;
}

export default function NoteViewerWrapper({
  initialDetail
}: {
  initialDetail: NoteDetailResponse;
}) {
  const [detail, setDetail] = useState(initialDetail);
  const [checking, setChecking] = useState(initialDetail.note.visibility === "password_protected" && !initialDetail.authorized);

  useEffect(() => {
    if (initialDetail.authorized || initialDetail.note.visibility !== "password_protected") {
      return;
    }

    let cancelled = false;
    void fetchNoteDetail(initialDetail.note.slug)
      .then((nextDetail) => {
        if (!cancelled) {
          setDetail(nextDetail);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setChecking(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialDetail]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!detail.authorized) {
    return (
      <LoginForm
        slug={detail.note.slug}
        onSuccess={async () => {
          const nextDetail = await fetchNoteDetail(detail.note.slug);
          setDetail(nextDetail);
        }}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b border-border shrink-0">
        <div className="px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              &larr; Notes
            </Link>
            <div>
              <h1 className="font-mono text-sm font-semibold text-foreground">
                {detail.note.title}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {detail.note.path}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <NoteViewer
          slug={detail.note.slug}
          html={detail.html ?? ""}
          commentsEnabled={detail.note.commentsEnabled}
        />
      </div>
    </div>
  );
}
