import { fetchNotes } from "@/lib/api";
import DirectoryPageClient from "@/components/DirectoryPageClient";
import type { NoteSummary } from "@commonplace/shared";

export const dynamic = "force-dynamic";

function getFolderTitle(query: string | undefined) {
  if (!query) {
    return "Commonplace";
  }
  const parts = query.split("/").map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) ?? "Commonplace";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return {
    title: getFolderTitle(typeof q === "string" ? q : undefined),
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  let notes: NoteSummary[] = [];
  let error: string | null = null;
  let warnings: string[] = [];
  try {
    const result = await fetchNotes();
    notes = result.notes;
    error = result.error;
    warnings = result.warnings;
  } catch (error) {
    console.error("Home page failed to load notes", error);
    error = error instanceof Error ? error.message : "Failed to load notes";
  }
  return <DirectoryPageClient notes={notes} error={error} warnings={warnings} admin={false} initialQuery={typeof q === "string" ? q : ""} />;
}
