import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CommentsStore } from "./comments-store.js";

test("CommentsStore persists and mutates comments by note id", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "obsidian-comments-store-"));
  const sqlitePath = path.join(tempDir, "comments.sqlite");
  const store = new CommentsStore(sqlitePath);

  const created = store.add("note-1", {
    authorEmail: "test@example.com",
    body: "hello world",
    anchorText: "hello",
    anchorStart: 0,
    anchorEnd: 5
  });

  assert.equal(store.list("note-1").length, 1);
  assert.equal(store.list("note-1")[0]?.id, created.id);

  const updated = store.updateStatus("note-1", created.id, "resolved");
  assert.equal(updated?.status, "resolved");
  assert.equal(store.list("note-1")[0]?.status, "resolved");

  assert.equal(store.delete("note-1", created.id), true);
  assert.equal(store.list("note-1").length, 0);
});
