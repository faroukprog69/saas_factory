"use client";

import { useState } from "react";
import { inviteMember } from "@/actions/teams";

export default function TestInvitePage() {
  const [teamId, setTeamId] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{
    success?: boolean;
    error?: string;
    message?: string;
  } | null>(null);

  const handleInvite = async () => {
    setStatus(null);
    const result = await inviteMember(teamId, email);
    setStatus(result);
  };

  return (
    <div className="p-10 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Test Team Invite & Paywall</h1>

      <div className="flex flex-col gap-2">
        <label>Team ID (Get it from Neon Studio):</label>
        <input
          className="border p-2 rounded"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          placeholder="e.g. team_abc_123"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label>User Email to Invite:</label>
        <input
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="test@example.com"
        />
      </div>

      <button
        onClick={handleInvite}
        className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        Send Invitation
      </button>

      {status?.error && (
        <div className="p-4 bg-red-100 text-red-700 rounded border border-red-200">
          ❌ {status.error}
        </div>
      )}

      {status?.success && (
        <div className="p-4 bg-green-100 text-green-700 rounded border border-green-200">
          ✅ {status.message}
        </div>
      )}
    </div>
  );
}
