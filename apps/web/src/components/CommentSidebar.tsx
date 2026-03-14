"use client";

import { useState } from "react";
import type { CommentRecord } from "@obsidian-comments/shared";

export type CommentData = CommentRecord;

interface Props {
  comments: CommentData[];
  activeCommentId: string | null;
  onCommentClick: (id: string) => void;
  onResolve: (id: string) => void;
  onReopen: (id: string) => void;
  onDelete: (id: string) => void;
  showResolved: boolean;
  onToggleResolved: () => void;
}

export default function CommentSidebar({
  comments,
  activeCommentId,
  onCommentClick,
  onResolve,
  onReopen,
  onDelete,
  showResolved,
  onToggleResolved,
}: Props) {
  const [sortMode, setSortMode] = useState<"document" | "chronological">("document");

  const filtered = showResolved ? comments : comments.filter((c) => c.status === "open");

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === "document") return a.anchorStart - b.anchorStart;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const openCount = comments.filter((c) => c.status === "open").length;
  const resolvedCount = comments.filter((c) => c.status === "resolved").length;

  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-mono text-sm font-semibold text-card-foreground">
            Comments
          </h2>
          <span className="text-xs text-muted-foreground">
            {openCount} open{resolvedCount > 0 && `, ${resolvedCount} resolved`}
          </span>
        </div>

        <div className="flex gap-2">
          <div className="flex rounded-full bg-secondary p-0.5 gap-0.5 text-xs">
            <button
              onClick={() => setSortMode("document")}
              className={`px-2 py-0.5 rounded-full transition-colors ${
                sortMode === "document" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Doc order
            </button>
            <button
              onClick={() => setSortMode("chronological")}
              className={`px-2 py-0.5 rounded-full transition-colors ${
                sortMode === "chronological" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Time
            </button>
          </div>

          <button
            onClick={onToggleResolved}
            className={`px-2 py-0.5 rounded-full text-xs transition-colors ${
              showResolved ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            No comments yet. Select text to add one.
          </div>
        ) : (
          sorted.map((comment) => (
            <div
              key={comment.id}
              onClick={() => onCommentClick(comment.id)}
              className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-accent ${
                activeCommentId === comment.id ? "bg-accent" : ""
              } ${comment.status === "resolved" ? "opacity-60" : ""}`}
            >
              <div className="text-xs text-primary font-mono mb-1 truncate">
                &ldquo;{comment.anchorText}&rdquo;
              </div>

              <p className="text-sm text-card-foreground mb-2 leading-relaxed">
                {comment.body}
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {comment.authorEmail.split("@")[0]} &middot;{" "}
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  {comment.status === "open" ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onResolve(comment.id); }}
                      className="text-xs px-2 py-0.5 rounded bg-success-bg text-success-fg hover:opacity-80"
                    >
                      Resolve
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); onReopen(comment.id); }}
                      className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground hover:opacity-80"
                    >
                      Reopen
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(comment.id); }}
                    className="text-xs px-2 py-0.5 rounded bg-error-bg text-error-fg hover:opacity-80"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
