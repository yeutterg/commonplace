import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { NoteRegistry } from "./note-registry.js";
import { FilesystemNotesIndex } from "./notes-index.js";

test("FilesystemNotesIndex assigns stable ids across path renames when slug stays the same", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-notes-index-"));
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-notes-state-"));
  const sqlitePath = path.join(stateDir, "registry.sqlite");
  const noteOne = path.join(tempDir, "first.md");

  fs.writeFileSync(
    noteOne,
    `---
title: Stable ID
publish: true
slug: stable-id
---

Hello world
`
  );

  const registry = new NoteRegistry(sqlitePath);
  const index = new FilesystemNotesIndex(tempDir, registry);

  const first = await index.getPublishedNoteBySlug("stable-id");
  assert.ok(first);

  const renamed = path.join(tempDir, "renamed.md");
  fs.renameSync(noteOne, renamed);

  const second = await index.getPublishedNoteBySlug("stable-id");
  assert.ok(second);
  assert.equal(second?.id, first?.id);
  assert.equal(second?.path, "renamed.md");
});
