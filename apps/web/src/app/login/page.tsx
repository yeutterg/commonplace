import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function sanitizeCallbackUrl(url: string | undefined): string {
  if (!url) return "/";
  // Only allow relative paths — prevent open redirect
  if (!url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl: rawCallbackUrl } = await searchParams;
  const callbackUrl = sanitizeCallbackUrl(rawCallbackUrl);

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <div className="protected-note-shell">
      <div className="protected-note-card">
        <div className="protected-note-lock">
          <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 1 1 8 0v3" />
          </svg>
        </div>
        <h1>Sign in to Commonplace</h1>
        <p className="vault-subtitle">Sign in to access your vaults and manage notes.</p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button type="submit" className="primary-button" style={{ width: "100%", justifyContent: "center", gap: 8 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18" />
              <path d="M12 3a14 14 0 0 1 0 18" />
              <path d="M12 3a14 14 0 0 0 0 18" />
            </svg>
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
