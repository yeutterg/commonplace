import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DirectoryPageClient from "@/components/DirectoryPageClient";
import VaultSelector from "@/components/VaultSelector";
import { fetchAdminNotes, fetchVaults } from "@/lib/api";
import type { NoteSummary } from "@commonplace/shared";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Commonplace — Admin" };
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; vault?: string }>;
}) {
  const session = await auth();
  const isAdmin = !!(session?.user?.email && session.user.email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase());
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (!isAdmin) {
    redirect("/");
  }

  const { q, vault } = await searchParams;
  const vaults = await fetchVaults();

  let notes: NoteSummary[] = [];
  let error: string | null = null;
  let warnings: string[] = [];

  try {
    const result = await fetchAdminNotes();
    notes = result.notes;
    error = result.error;
    warnings = result.warnings;
  } catch (loadError) {
    console.error("Admin page failed to load notes", loadError);
    error = loadError instanceof Error ? loadError.message : "Failed to load notes";
  }

  if (vaults.length > 1 && !vault) {
    const noteCounts: Record<string, number> = {};
    for (const v of vaults) {
      noteCounts[v.id] = notes.filter((n) => n.slug.startsWith(`${v.id}/`)).length;
    }
    return <VaultSelector vaults={vaults} noteCounts={noteCounts} admin />;
  }

  const filteredNotes = vault
    ? notes.filter((n) => n.slug.startsWith(`${vault}/`))
    : notes;

  const vaultName = vault
    ? vaults.find((v) => v.id === vault)?.name ?? vault
    : vaults.length === 1 ? vaults[0].name : "Commonplace";

  return (
    <DirectoryPageClient
      notes={filteredNotes}
      error={error}
      warnings={warnings}
      admin
      initialQuery={typeof q === "string" ? q : ""}
      vaultName={vaultName}
      vaultId={vault}
      multiVault={vaults.length > 1}
    />
  );
}
