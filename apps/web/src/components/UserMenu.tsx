"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        className="icon-button"
        onClick={() => void signIn("google")}
        aria-label="Sign in"
        title="Sign in"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
    );
  }

  const initials = session.user.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <button
      type="button"
      className="user-avatar-button"
      onClick={() => void signOut()}
      aria-label={`Signed in as ${session.user.email}. Click to sign out.`}
      title={`${session.user.email}\nClick to sign out`}
    >
      {session.user.image ? (
        <img
          src={session.user.image}
          alt=""
          className="user-avatar-img"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="user-avatar-initials">{initials}</span>
      )}
    </button>
  );
}
