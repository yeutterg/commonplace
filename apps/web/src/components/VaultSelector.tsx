"use client";

import Link from "next/link";
import type { VaultInfo } from "@/lib/api";
import { FolderIcon } from "./Icons";
import ThemeToggle from "./ThemeToggle";

const VAULT_COLORS = [
  "linear-gradient(135deg, #7f6df2, #6c5ce7)",
  "linear-gradient(135deg, #e67e22, #d35400)",
  "linear-gradient(135deg, #2ecc71, #27ae60)",
  "linear-gradient(135deg, #3498db, #2980b9)",
  "linear-gradient(135deg, #e74c3c, #c0392b)",
  "linear-gradient(135deg, #f39c12, #e67e22)",
];

interface Props {
  vaults: VaultInfo[];
  noteCounts: Record<string, number>;
  admin: boolean;
}

export default function VaultSelector({ vaults, noteCounts, admin }: Props) {
  return (
    <div className="vault-page">
      <div className="note-topbar">
        <div className="note-topbar-left">
          <span className="vault-topbar-label">Vaults</span>
        </div>
        <div className="note-topbar-actions">
          <ThemeToggle variant="icon" />
        </div>
      </div>
      <div className="vault-selector-content">
        <div className="vault-selector-header">
          <h1 className="vault-selector-title">Your Vaults</h1>
          <p className="vault-selector-subtitle">
            Select a vault to browse {admin ? "and manage " : ""}its notes
          </p>
        </div>
        <div className="vault-grid">
          {vaults.map((vault, index) => (
            <Link
              key={vault.id}
              href={admin ? `/admin?vault=${vault.id}` : `/?vault=${vault.id}`}
              className="vault-card"
            >
              <div className="vault-card-top">
                <div
                  className="vault-card-icon"
                  style={{ background: VAULT_COLORS[index % VAULT_COLORS.length] }}
                >
                  <FolderIcon width={20} height={20} />
                </div>
                <div className="vault-card-info">
                  <span className="vault-card-name">{vault.name}</span>
                  <span className="vault-card-count">
                    {noteCounts[vault.id] ?? 0} notes
                  </span>
                </div>
              </div>
              <div className="vault-card-bottom">
                <div className="vault-card-status">
                  <span className="vault-card-dot" />
                  <span className="vault-card-connected">Connected</span>
                </div>
                {admin ? <span className="vault-admin-label">Admin</span> : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
