
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

type Membership = {
  id: string;
  role: string;
  community_id: string;
  communities:
    | { name: string }
    | { name: string }[]
    | null;
};

const roleInfo: Record<
  string,
  { title: string; description: string; destination: string }
> = {
  OWNER: {
    title: "Community Owner",
    description: "Manage your organization's settings and operations.",
    destination: "/dashboard",
  },
  COMMUNITY_ADMIN: {
    title: "Community Admin",
    description: "Manage community members and incoming complaints.",
    destination: "/dashboard",
  },
  MODERATOR: {
    title: "Moderator",
    description: "Moderate reports and help maintain community standards.",
    destination: "/dashboard",
  },
  MEMBER: {
    title: "Member",
    description: "Report problems, rate their severity and track solutions.",
    destination: "/member",
  },
};

export default async function SelectRolePage() {
  const supabase = await createClient();

  // Verify login
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch actual platform roles
  const { data: platformRoles, error: platformError } = await supabase
    .from("platform_roles")
    .select("role")
    .eq("user_id", user.id);

  // Fetch actual community memberships
  const { data: membershipData, error: membershipError } = await supabase
    .from("memberships")
    .select("id, role, community_id, communities(name)")
    .eq("user_id", user.id);

  if (platformError || membershipError) {
    console.error("Role selection error:", {
      platformError,
      membershipError,
    });

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-lg rounded-2xl border border-red-500/20 bg-white/5 p-8">
          <h1 className="text-2xl font-bold">Unable to load your roles</h1>
          <p className="mt-3 text-slate-400">
            We couldn't retrieve your account permissions. Please try again.
          </p>
          <Link href="/login" className="mt-5 inline-block text-blue-400 underline">
            Return to login
          </Link>
        </div>
      </main>
    );
  }

  const memberships = (membershipData ?? []) as Membership[];

  const isSuperAdmin = platformRoles?.some(
    (item) => item.role === "SUPER_ADMIN"
  );

  const isPlatformSupport = platformRoles?.some(
    (item) => item.role === "PLATFORM_SUPPORT"
  );

  const hasCommunityMembership = memberships.length > 0;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Akshep
        </Link>

        <div className="mt-12">
          <p className="text-sm font-medium uppercase tracking-wider text-blue-400">
            Account access
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Choose your workspace
          </h1>

          <p className="mt-3 text-slate-400">
            Select a role and organization to continue. Only roles assigned
            to your account are available.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Signed in as {user.email}
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {/* Super Admin */}
          {isSuperAdmin && (
            <Link
              href="/admin"
              className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 transition hover:border-blue-400 hover:bg-blue-500/20"
            >
              <h2 className="text-xl font-semibold">Super Admin</h2>
              <p className="mt-2 text-sm text-slate-300">
                Manage Akshep, approve communities and review escalated reports.
              </p>
              <p className="mt-5 text-sm font-medium text-blue-400">
                Enter Super Admin workspace →
              </p>
            </Link>
          )}

          {/* Platform Support */}
          {isPlatformSupport && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-semibold">Platform Support</h2>
              <p className="mt-2 text-sm text-slate-400">
                Your account has platform support access. A dedicated
                support workspace will be added separately.
              </p>
            </div>
          )}

          {/* Community memberships */}
          {memberships.map((membership) => {
            const info = roleInfo[membership.role];

            if (!info) return null;

            const communityData = membership.communities;
            const community = Array.isArray(communityData)
              ? communityData[0]
              : communityData;

            if (!community) return null;

            const destination =
              `${info.destination}?communityId=` +
              encodeURIComponent(membership.community_id);

            return (
              <Link
                key={membership.id}
                href={destination}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-blue-500/60 hover:bg-white/10"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
                  {info.title}
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  {community.name}
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  {info.description}
                </p>

                <p className="mt-5 text-sm font-medium text-blue-400">
                  Enter this workspace →
                </p>
              </Link>
            );
          })}
        </div>

        {/* No community membership yet */}
        {!hasCommunityMembership && (
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">
              Not part of an organization yet?
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Join an existing organization using its invitation key.
              You can also join more organizations later using this same account.
            </p>

            <Link
              href="/select-organization"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Join an Organization
            </Link>
          </div>
        )}

        <div className="mt-10 border-t border-white/10 pt-6">
          <Link
            href="/login"
            className="text-sm text-slate-400 hover:text-white"
          >
            Sign out and return to login
          </Link>
        </div>
      </div>
    </main>
  );
}
