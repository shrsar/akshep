
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type Community = {
  id: string;
  name: string;
  community_type: string;
};

export default function SelectOrganizationPage() {
  const router = useRouter();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadCommunities() {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error: communityError } = await supabase.rpc(
        "list_joinable_communities"
      );

      if (communityError) {
        console.error("Community loading error:", communityError);
        setError("Unable to load organisations. Please try again.");
        setLoading(false);
        return;
      }

      setCommunities((data ?? []) as Community[]);
      setLoading(false);
    }

    loadCommunities();
  }, [router]);

  async function handleJoin() {
    setError("");
    setSuccess("");

    if (!selectedCommunityId) {
      setError("Please select an organisation.");
      return;
    }

    if (!inviteCode.trim()) {
      setError("Please enter your invitation key.");
      return;
    }

    setJoining(true);

    const supabase = createClient();

    const { data, error: joinError } = await supabase.rpc(
      "join_community_with_invite",
      {
        p_community_id: selectedCommunityId,
        p_invite_code: inviteCode.trim(),
      }
    );

    if (joinError) {
      console.error("Join organisation error:", joinError);
      setError(joinError.message || "Unable to join this organisation.");
      setJoining(false);
      return;
    }

    const communityId = data as string;

    setSuccess("You have successfully joined the organisation.");

    router.replace(
      `/member?communityId=${encodeURIComponent(communityId)}`
    );

    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <header className="mb-10">
          <a href="/" className="text-3xl font-bold tracking-tight">
            Akshep
          </a>

          <p className="mt-2 text-sm text-slate-400">
            Join an organisation
          </p>
        </header>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 shadow-xl">
          <h1 className="text-2xl font-bold">
            Choose your organisation
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Select the organisation you want to join and enter the
            invitation key provided by its administrator.
          </p>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              Loading organisations...
            </div>
          ) : (
            <>
              {communities.length === 0 ? (
                <div className="mt-7 rounded-xl border border-white/10 bg-slate-900 p-5">
                  <p className="font-medium">
                    No organisations are currently available.
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    Organisations appear here when they have an active
                    invitation key. Contact your organisation's
                    administrator.
                  </p>
                </div>
              ) : (
                <>
                  <label className="mt-7 block text-sm font-medium">
                    Select organisation
                  </label>

                  <select
                    value={selectedCommunityId}
                    onChange={(e) =>
                      setSelectedCommunityId(e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-white outline-none focus:border-blue-500"
                  >
                    <option value="">
                      Choose an organisation
                    </option>

                    {communities.map((community) => (
                      <option
                        key={community.id}
                        value={community.id}
                      >
                        {community.name} — {community.community_type}
                      </option>
                    ))}
                  </select>

                  <label className="mt-6 block text-sm font-medium">
                    Invitation key
                  </label>

                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter your invitation key"
                    autoComplete="off"
                    className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={joining}
                    className="mt-7 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {joining ? "Joining..." : "Join Organisation"}
                  </button>
                </>
              )}
            </>
          )}

          {error && (
            <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-5 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
              {success}
            </p>
          )}

          <div className="mt-7 border-t border-white/10 pt-5 text-center">
            <a
              href="/select-role"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Back to role selection
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
