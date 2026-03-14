"use client";

import { useEffect, useRef, useState } from "react";
import type { CommentRecord } from "@obsidian-comments/shared";
import CommentSidebar, { CommentData } from "./CommentSidebar";
import CommentForm from "./CommentForm";
import { getClientApiBaseUrl } from "@/lib/api-base";

interface Props {
  slug: string;
  html: string;
  commentsEnabled: boolean;
}

function applyCommentHighlights(
  html: string,
  comments: CommentData[],
  showResolved: boolean,
  activeCommentId: string | null,
) {
  if (!comments.length || typeof DOMParser === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const nodes: { node: Text; start: number; end: number }[] = [];
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  let currentOffset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const length = node.textContent?.length ?? 0;
    nodes.push({ node, start: currentOffset, end: currentOffset + length });
    currentOffset += length;
  }

  const highlightableComments = comments
    .filter((comment) => comment.status === "open" || showResolved)
    .filter((comment) => comment.anchorEnd > comment.anchorStart)
    .slice()
    .sort((a, b) => b.anchorStart - a.anchorStart);

  for (const comment of highlightableComments) {
    const target = nodes.find(
      ({ start, end }) => comment.anchorStart >= start && comment.anchorEnd <= end,
    );

    if (!target) {
      continue;
    }

    const text = target.node.textContent ?? "";
    const localStart = comment.anchorStart - target.start;
    const localEnd = comment.anchorEnd - target.start;

    if (
      localStart < 0 ||
      localEnd > text.length ||
      localStart >= localEnd ||
      text.slice(localStart, localEnd) !== comment.anchorText
    ) {
      continue;
    }

    const fragment = doc.createDocumentFragment();
    const mark = doc.createElement("mark");

    if (localStart > 0) {
      fragment.appendChild(doc.createTextNode(text.slice(0, localStart)));
    }

    mark.dataset.commentId = comment.id;
    if (activeCommentId === comment.id) {
      mark.className = "active";
    }
    mark.textContent = text.slice(localStart, localEnd);
    fragment.appendChild(mark);

    if (localEnd < text.length) {
      fragment.appendChild(doc.createTextNode(text.slice(localEnd)));
    }

    target.node.parentNode?.replaceChild(fragment, target.node);
  }

  return doc.body.innerHTML;
}

async function fetchComments(slug: string): Promise<CommentRecord[]> {
  const res = await fetch(`${getClientApiBaseUrl()}/api/notes/${slug}/comments`, {
    credentials: "include"
  });

  if (!res.ok) {
    return [];
  }

  const data = await res.json() as { comments: CommentRecord[] };
  return data.comments;
}

export default function NoteViewer({ slug, html, commentsEnabled }: Props) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [selection, setSelection] = useState<{
    text: string;
    start: number;
    end: number;
    rect: DOMRect;
  } | null>(null);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  async function reloadComments() {
    if (!commentsEnabled) {
      setComments([]);
      return;
    }

    setComments(await fetchComments(slug));
  }

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      if (!commentsEnabled) {
        setComments([]);
        return;
      }

      const nextComments = await fetchComments(slug);
      if (!cancelled) {
        setComments(nextComments);
      }
    }

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, [commentsEnabled, slug]);

  const highlightedHtml = applyCommentHighlights(
    html,
    comments,
    showResolved,
    activeCommentId,
  );

  useEffect(() => {
    if (!commentsEnabled) return;

    function handleMouseUp() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        return;
      }

      const range = sel.getRangeAt(0);
      const container = contentRef.current;
      if (
        !container ||
        !container.contains(range.startContainer) ||
        !container.contains(range.endContainer)
      ) {
        return;
      }

      const text = sel.toString().trim();
      if (!text || text.length < 2) return;

      const startRange = range.cloneRange();
      startRange.selectNodeContents(container);
      startRange.setEnd(range.startContainer, range.startOffset);

      const start = startRange.toString().length;
      const end = start + text.length;
      const rect = range.getBoundingClientRect();

      setSelection({ text, start, end, rect });
      setShowCommentForm(false);
    }

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [commentsEnabled]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    function handleClick(e: Event) {
      const target = e.target as HTMLElement;
      if (target.tagName === "MARK" && target.dataset.commentId) {
        setActiveCommentId(target.dataset.commentId);
      }
    }

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, []);

  async function updateComment(id: string, status: "open" | "resolved") {
    await fetch(`${getClientApiBaseUrl()}/api/notes/${slug}/comments/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await reloadComments();
  }

  async function handleDelete(id: string) {
    await fetch(`${getClientApiBaseUrl()}/api/notes/${slug}/comments/${id}`, {
      method: "DELETE",
      credentials: "include"
    });
    await reloadComments();
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-12">
          <div
            ref={contentRef}
            className="prose"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </div>
      </div>

      {selection && !showCommentForm && (
        <div
          className="selection-tooltip"
          style={{
            position: "fixed",
            top: selection.rect.bottom + 8,
            left: selection.rect.left + selection.rect.width / 2 - 55,
          }}
        >
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setShowCommentForm(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-lg hover:opacity-90 transition-opacity"
          >
            + Comment
          </button>
        </div>
      )}

      {selection && showCommentForm && (
        <CommentForm
          slug={slug}
          anchorText={selection.text}
          anchorStart={selection.start}
          anchorEnd={selection.end}
          position={{
            top: selection.rect.bottom + 8,
            left: Math.min(selection.rect.left, window.innerWidth - 340),
          }}
          onSubmit={() => {
            setShowCommentForm(false);
            setSelection(null);
            window.getSelection()?.removeAllRanges();
            void reloadComments();
          }}
          onCancel={() => {
            setShowCommentForm(false);
            setSelection(null);
            window.getSelection()?.removeAllRanges();
          }}
        />
      )}

      {commentsEnabled && (
        <CommentSidebar
          comments={comments}
          activeCommentId={activeCommentId}
          onCommentClick={setActiveCommentId}
          onResolve={(id) => void updateComment(id, "resolved")}
          onReopen={(id) => void updateComment(id, "open")}
          onDelete={(id) => void handleDelete(id)}
          showResolved={showResolved}
          onToggleResolved={() => setShowResolved(!showResolved)}
        />
      )}
    </div>
  );
}
