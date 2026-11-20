
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

type MemberPageProps = {
  searchParams: Promise<{
    communityId?: string;
  }>;
};

export default async function MemberPage({
  searchParams,
}: MemberPageProps) {
  const { communityId } = await searchParams;

  const supabase = await createClient();

  // 1. Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  if (!communityId) {
    redirect("/select-role");
  }

  // 2. Verify that the user has the MEMBER role in this organization
  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("id, role, community_id")
    .eq("user_id", user.id)
    .eq("community_id", communityId)
    .maybeSingle();

  if (membershipError) {
    console.error("Member membership error:", membershipError);

    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <h1 className="text-2xl font-bold">Unable to verify access</h1>
        <p className="mt-3 text-slate-400">
          Please try again later.
        </p>
        <Link href="/select-role" className="mt-6 inline-block text-blue-400 underline">
          Back to role selection
        </Link>
      </main>
    );
  }

  if (!membership) {
    redirect("/select-role");
  }

  if (membership.role !== "MEMBER") {
    redirect(`/dashboard?communityId=${encodeURIComponent(communityId)}`);
  }

  // 3. Fetch organization details
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("id, name, community_type, address")
    .eq("id", membership.community_id)
    .maybeSingle();

  if (communityError || !community) {
    console.error("Member community error:", communityError);

    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <h1 className="text-2xl font-bold">Organization unavailable</h1>
        <Link href="/select-role" className="mt-6 inline-block text-blue-400 underline">
          Choose another workspace
        </Link>
      </main>
    );
  }

  // 4. Fetch only this member's own reports
  const { data: reports, error: reportsError } = await supabase
    .from("problem_reports")
    .select("id, title, category, location, status, created_at")
    .eq("community_id", communityId)
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  const statusLabels: Record<string, string> = {
    OPEN: "Open",
    UNDER_REVIEW: "Under Review",
    IN_PROGRESS: "In Progress",
    RESOLVED: "Resolved",
    REJECTED: "Rejected",
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5 md:px-10">
        <div>
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Akshep
          </Link>
          <p className="mt-1 text-sm text-slate-400">
            Member workspace
          </p>
        </div>

        <Link
          href="/select-role"
          className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
        >
          Switch workspace
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12 md:px-10">
        <p className="text-sm font-medium uppercase tracking-wider text-blue-400">
          Community Member
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Welcome to {community.name}
        </h1>

        <p className="mt-4 text-slate-400">
          Report problems, follow their progress and help improve your community.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">Your organization</p>
          <h2 className="mt-2 text-xl font-semibold">
            {community.name}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {community.community_type} · {community.address}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">My Reports</h2>
            <p className="mt-2 text-sm text-slate-400">
              Track the complaints you have submitted.
            </p>
          </div>

          <Link
            href={`/dashboard/report?communityId=${encodeURIComponent(community.id)}`}
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            + Report a Problem
          </Link>
        </div>

        {reportsError ? (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-300">
            We couldn't load your reports. Please refresh the page.
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <h3 className="text-lg font-semibold">
              You haven't submitted any reports yet.
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              If you notice a problem in your organization, report it here.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {reports.map((report) => (
              <article
                key={report.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {report.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {report.category}
                      {report.location ? ` · ${report.location}` : ""}
                    </p>
                  </div>

                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">
                    {statusLabels[report.status] ?? report.status}
                  </span>
                </div>

                <p className="mt-4 text-xs text-slate-500">
                  Submitted {new Date(report.created_at).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}

        <p className="mt-12 text-xs text-slate-500">
          Signed in as {user.email}
        </p>
      </section>
    </main>
  );
}
