"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { NoteSummary } from "@commonplace/shared";
import {
  buildDirectoryTree,
  collectFolderIds,
  filterDirectory,
  folderNoteCount,
  getNoteHref,
  type DirectoryNode,
} from "@/lib/directory-tree";
import { ArrowUpRightIcon, ChevronDownIcon, ChevronRightIcon, FolderIcon, ShareIcon } from "./Icons";
import ThemeToggle from "@/components/ThemeToggle";

function statusForNote(note: NoteSummary) {
  if (note.visibility === "users") {
    return { label: "Users", className: "status-pill status-pill-users" };
  }
  if (note.visibility === "password") {
    return { label: "Private", className: "status-pill status-pill-private" };
  }
  if (note.published) {
    return { label: "Published", className: "status-pill status-pill-published" };
  }
  return { label: "Draft", className: "status-pill status-pill-draft" };
}

function TreeRow({
  node,
  depth,
  expanded,
  onToggle,
  admin,
}: {
  node: DirectoryNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  admin: boolean;
}) {
  if (node.type === "note") {
    const status = statusForNote(node.note);
    const href = admin ? `/admin${getNoteHref(node.note.slug)}` : getNoteHref(node.note.slug);

    return (
      <Link href={href} className="vault-row vault-row-note" style={{ paddingLeft: 20 + depth * 18 }}>
        <span className="vault-row-main">
          <span className="vault-row-icon"><ArrowUpRightIcon width={14} height={14} /></span>
          <span className="vault-row-label">{node.name.replace(/\.md$/i, "")}</span>
        </span>
        {admin ? (
          <span className="vault-row-meta">
            <span className={status.className}>{status.label}</span>
            <span className="vault-row-comments">
              {node.note.commentCount} {node.note.commentCount === 1 ? "comment" : "comments"}
            </span>
          </span>
        ) : (
          <span className="vault-row-open">Open</span>
        )}
      </Link>
    );
  }

  const isOpen = expanded.has(node.id);
  const count = folderNoteCount(node);

  return (
    <div className="vault-group">
      <button
        type="button"
        className="vault-row vault-row-folder"
        onClick={() => onToggle(node.id)}
        style={{ paddingLeft: 20 + depth * 18 }}
      >
        <span className="vault-row-main">
          <span className="vault-row-icon">
            {isOpen ? <ChevronDownIcon width={14} height={14} /> : <ChevronRightIcon width={14} height={14} />}
          </span>
          <span className="vault-row-icon"><FolderIcon width={15} height={15} /></span>
          <span className="vault-row-label">{node.name}</span>
        </span>
        <span className="vault-row-count">{count}</span>
      </button>

      {isOpen && (
        <div className="vault-children">
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              admin={admin}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DirectoryPageClient({
  notes,
  error,
  warnings,
  admin = false,
  initialQuery = "",
  vaultName = "Commonplace",
  vaultId,
  multiVault = false,
}: {
  notes: NoteSummary[];
  error: string | null;
  warnings: string[];
  admin?: boolean;
  initialQuery?: string;
  vaultName?: string;
  vaultId?: string;
  multiVault?: boolean;
}) {
  const tree = useMemo(() => buildDirectoryTree(notes), [notes]);
  const allFolderIds = useMemo(() => collectFolderIds(tree), [tree]);
  const [query, setQuery] = useState(initialQuery);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(allFolderIds));

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setExpanded((current) => {
      if (current.size > 0) {
        return current;
      }
      return new Set(allFolderIds);
    });
  }, [allFolderIds]);

  const filteredTree = useMemo(() => filterDirectory(tree, query), [tree, query]);
  const forcedExpanded = useMemo(() => new Set(collectFolderIds(filteredTree)), [filteredTree]);
  const effectiveExpanded = query.trim() ? forcedExpanded : expanded;
  const folderCount = allFolderIds.length;
  const totalNotes = notes.length;

  const handleToggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleShare = async () => {
    const url = typeof window === "undefined" ? "" : window.location.href;
    if (!url) {
      return;
    }

    if (navigator.share) {
      await navigator.share({ url, title: vaultName }).catch(() => undefined);
      return;
    }

    await navigator.clipboard.writeText(url).catch(() => undefined);
  };

  const vaultsHref = admin ? "/admin" : "/";

  return (
    <div className="vault-page">
      <div className="note-topbar">
        <div className="note-topbar-left">
          {multiVault ? (
            <div className="note-breadcrumbs">
              <Link href={vaultsHref} className="note-breadcrumb-link">vaults</Link>
              <span className="note-breadcrumb-sep">/</span>
              <span className="note-breadcrumb-current">{vaultName}</span>
            </div>
          ) : (
            <span className="vault-topbar-label">{vaultName}</span>
          )}
          {admin ? <span className="vault-admin-label">Admin</span> : null}
        </div>
        <div className="note-topbar-actions">
          {admin ? (
            <button type="button" className="icon-button" onClick={() => void handleShare()} aria-label="Share vault">
              <ShareIcon width={16} height={16} />
            </button>
          ) : null}
          <ThemeToggle variant="icon" />
        </div>
      </div>

      <div className="vault-directory-content">
        <div className="vault-directory-header">
          <h1 className="vault-directory-title">{vaultName}</h1>
          <p className="vault-subtitle">
            {totalNotes} notes across {folderCount} folders
          </p>
        </div>

        <label className="vault-search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notes..."
            aria-label="Search directory"
          />
        </label>

        <main className="vault-tree-shell">
          {error ? (
            <div className="vault-alert vault-alert-error">
              <strong>Vault unavailable.</strong> {error}
            </div>
          ) : null}

          {!error && warnings.length > 0 ? (
            <div className="vault-alert">
              <strong>Partial vault load.</strong> {warnings[0]}
              {warnings.length > 1 ? ` (+${warnings.length - 1} more)` : ""}
            </div>
          ) : null}

          {filteredTree.length === 0 ? (
            <div className="vault-empty">
              {error ? "The vault could not be read." : "No matching notes."}
            </div>
          ) : (
            filteredTree.map((node) => (
              <TreeRow
                key={node.id}
                node={node}
                depth={0}
                expanded={effectiveExpanded}
                onToggle={handleToggle}
                admin={admin}
              />
            ))
          )}
        </main>
      </div>
    </div>
  );
}
