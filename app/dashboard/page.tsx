
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

type DashboardPageProps = {
  searchParams: Promise<{
    communityId?: string;
  }>;
};

const roleDetails: Record<
  string,
  { title: string; description: string }
> = {
  OWNER: {
    title: "Community Owner",
    description:
      "You have owner-level access to manage this community and its operations.",
  },
  COMMUNITY_ADMIN: {
    title: "Community Admin",
    description:
      "You can manage community members and oversee reported problems.",
  },
  MODERATOR: {
    title: "Moderator",
    description:
      "You can help moderate reports and maintain community standards.",
  },
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { communityId } = await searchParams;

  const supabase = await createClient();

  // 1. Verify the logged-in user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Require a selected community.
  if (!communityId) {
    redirect("/select-role");
  }

  // 3. Verify actual membership in the selected community.
  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("id, role, community_id")
    .eq("user_id", user.id)
    .eq("community_id", communityId)
    .maybeSingle();

  if (membershipError) {
    console.error("Membership lookup error:", membershipError);

    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <h1 className="text-2xl font-bold">
          Unable to load workspace
        </h1>

        <p className="mt-3 text-slate-300">
          We couldn't verify your community membership. Please try again.
        </p>

        <Link
          href="/select-role"
          className="mt-6 inline-block text-blue-400 underline"
        >
          Back to role selection
        </Link>
      </main>
    );
  }

  if (!membership) {
    redirect("/select-role");
  }

  // 4. Members must use their dedicated member dashboard.
  if (membership.role === "MEMBER") {
    redirect(
      `/member?communityId=${encodeURIComponent(membership.community_id)}`
    );
  }

  // 5. Only these roles can access the community dashboard.
  const allowedRoles = ["OWNER", "COMMUNITY_ADMIN", "MODERATOR"];

  if (!allowedRoles.includes(membership.role)) {
    redirect("/select-role");
  }

  // 6. Fetch community information.
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("id, name, community_type, address, description")
    .eq("id", membership.community_id)
    .maybeSingle();

  if (communityError || !community) {
    console.error("Community lookup error:", communityError);

    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <h1 className="text-2xl font-bold">
          Workspace unavailable
        </h1>

        <p className="mt-3 text-slate-300">
          We couldn't load this community.
        </p>

        <Link
          href="/select-role"
          className="mt-6 inline-block text-blue-400 underline"
        >
          Choose another workspace
        </Link>
      </main>
    );
  }

  // 7. Resolve the user's actual role.
  const role = membership.role;
  const details = roleDetails[role];

  // 8. Only Owners and Community Admins can access the complaint inbox.
  const canManageComplaints = [
    "OWNER",
    "COMMUNITY_ADMIN",
  ].includes(role);

  const reportUrl = `/dashboard/report?communityId=${encodeURIComponent(
    community.id
  )}`;

  const complaintsUrl = `/dashboard/reports?communityId=${encodeURIComponent(
    community.id
  )}`;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-5 md:px-10">
        <div>
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight"
          >
            Akshep
          </Link>

          <p className="mt-1 text-sm text-slate-400">
            Community workspace
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
        {/* Welcome */}
        <p className="text-sm font-medium uppercase tracking-wider text-blue-400">
          {details.title}
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          Welcome to {community.name}
        </h1>

        <p className="mt-4 max-w-2xl text-slate-300">
          {details.description}
        </p>

        {/* Community information */}
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Community
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {community.name}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {community.community_type}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              {community.address}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-400">
              Your access level
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              {details.title}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {details.description}
            </p>
          </div>
        </div>

        {/* Workspace tools */}
        <section className="mt-12">
          <div>
            <h2 className="text-2xl font-bold">
              Your workspace
            </h2>

            <p className="mt-2 text-slate-400">
              Manage problems and follow your community's progress.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Report a problem */}
            <Link
              href={reportUrl}
              className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 transition hover:border-blue-400 hover:bg-blue-500/20"
            >
              <h3 className="font-semibold text-blue-300">
                + Report a Problem
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Submit a new community issue with details and photo evidence.
              </p>
            </Link>

            {/* Complaint inbox */}
            {canManageComplaints && (
              <Link
                href={complaintsUrl}
                className="rounded-xl border border-white/10 p-5 transition hover:border-blue-500/60 hover:bg-white/5"
              >
                <h3 className="font-semibold">
                  Community Complaint Inbox
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  View complaints submitted by members and moderators.
                </p>

                <p className="mt-3 text-xs text-blue-400">
                  Open complaint inbox →
                </p>
              </Link>
            )}

            {/* Reported problems */}
            <div className="rounded-xl border border-white/10 p-5">
              <h3 className="font-semibold">
                Reported Problems
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Track the reports submitted in your community.
              </p>

              <p className="mt-3 text-xs text-blue-400">
                Coming next
              </p>
            </div>

            {/* Community activity */}
            <div className="rounded-xl border border-white/10 p-5">
              <h3 className="font-semibold">
                Community Activity
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Follow discussions and community updates.
              </p>

              <p className="mt-3 text-xs text-blue-400">
                Coming next
              </p>
            </div>

            {/* Solutions */}
            <div className="rounded-xl border border-white/10 p-5">
              <h3 className="font-semibold">
                Solutions
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Track proposed and verified solutions.
              </p>

              <p className="mt-3 text-xs text-blue-400">
                Coming next
              </p>
            </div>
          </div>
        </section>

        {/* Account information */}
        <p className="mt-12 text-xs text-slate-500">
          Signed in as {user.email}
        </p>
      </section>
    </main>
  );
}
