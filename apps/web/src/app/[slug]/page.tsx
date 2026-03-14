import { notFound } from "next/navigation";
import NoteViewerWrapper from "./NoteViewerWrapper";
import { fetchNoteDetail } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const detail = await fetchNoteDetail(slug);
    return {
      title: `${detail.note.title} — Obsidian Comments`
    };
  } catch {
    return { title: "Not Found" };
  }
}

export default async function NotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let detail;

  try {
    detail = await fetchNoteDetail(slug);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  return <NoteViewerWrapper initialDetail={detail} />;
}
