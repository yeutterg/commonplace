"use client";

import { useState } from "react";
import { getClientApiBaseUrl } from "@/lib/api-base";

interface Props {
  slug: string;
  anchorText: string;
  anchorStart: number;
  anchorEnd: number;
  position: { top: number; left: number };
  onSubmit: () => void;
  onCancel: () => void;
}

export default function CommentForm({ slug, anchorText, anchorStart, anchorEnd, position, onSubmit, onCancel }: Props) {
  const [email, setEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("commenter-email") || "";
    }
    return "";
  });
  const [body, setBody] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !email.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${getClientApiBaseUrl()}/api/notes/${slug}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorEmail: email,
          body,
          anchorText,
          anchorStart,
          anchorEnd,
          honeypot,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit");
        return;
      }

      localStorage.setItem("commenter-email", email);
      setBody("");
      onSubmit();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="selection-tooltip fixed w-80 bg-popover border border-border rounded-xl shadow-lg p-4"
      style={{ top: position.top, left: position.left }}
    >
      <div className="text-xs text-primary font-mono mb-3 truncate">
        &ldquo;{anchorText}&rdquo;
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <textarea
          required
          placeholder="Add a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="w-full px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {error && <p className="text-xs text-error-fg">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Sending..." : "Comment"}
          </button>
        </div>
      </form>
    </div>
  );
}
