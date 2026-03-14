import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { fetchNotes } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const notes = await fetchNotes();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-mono text-lg font-semibold text-foreground">
              Obsidian Comments
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Remote-friendly markdown review UI backed by a vault-aware API.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-12">
        {notes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-2">No published notes yet.</p>
            <p className="text-sm text-muted-foreground">
              Publish notes into the backend vault adapter and they will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/${note.slug}`}
                className="block p-4 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-mono font-medium text-card-foreground">
                      {note.title}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {note.path}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {note.visibility === "password_protected" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-warning-bg text-warning-fg">
                        Protected
                      </span>
                    )}
                    {!note.commentsEnabled && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        Read only
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
