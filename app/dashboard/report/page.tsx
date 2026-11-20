
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import ReportForm from "./ReportForm";

type ReportPageProps = {
  searchParams: Promise<{
    communityId?: string;
  }>;
};

export default async function ReportPage({
  searchParams,
}: ReportPageProps) {
  const { communityId } = await searchParams;

  const supabase = await createClient();

  // 1. Verify authentication.
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

  // 3. Verify that the user belongs to this community.
  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("id, community_id")
    .eq("user_id", user.id)
    .eq("community_id", communityId)
    .maybeSingle();

  if (membershipError) {
    console.error("Report page membership error:", membershipError);

    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <h1 className="text-2xl font-bold">
          Unable to verify community access
        </h1>

        <p className="mt-3 text-slate-400">
          Please try again or return to your workspace.
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

  // 4. Fetch the community details.
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("id, name")
    .eq("id", membership.community_id)
    .maybeSingle();

  if (communityError || !community) {
    console.error("Report page community error:", communityError);

    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <h1 className="text-2xl font-bold">
          Community unavailable
        </h1>

        <p className="mt-3 text-slate-400">
          We could not load this community. Please try again.
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

  // 5. Render the reporting form.
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">

        <Link
          href={`/dashboard?communityId=${community.id}`}
          className="text-sm text-blue-400 transition hover:text-blue-300 hover:underline"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-8">
          <p className="text-sm font-medium uppercase tracking-wider text-blue-400">
            {community.name}
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Report a Problem
          </h1>

          <p className="mt-3 leading-relaxed text-slate-400">
            Describe the issue clearly so your community can understand
            the problem, assess its severity and work towards resolving it.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8">
          <ReportForm communityId={community.id} />
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Your report will be visible to authorised members of this community.
        </p>

      </div>
    </main>
  );
}
