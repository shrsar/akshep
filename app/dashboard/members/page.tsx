
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import MemberRequests from "./MemberRequests";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    communityId?: string;
  }>;
};

export default async function MembersPage({
  searchParams,
}: PageProps) {
  const { communityId } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships, error: membershipError } =
    await supabase
      .from("memberships")
      .select("community_id, role, approval_status")
      .eq("user_id", user.id)
      .eq("approval_status", "APPROVED");

  if (membershipError || !memberships?.length) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <p className="text-red-600">
          Could not load your community membership.
        </p>
      </main>
    );
  }

  const membership = communityId
    ? memberships.find(
        (item) => item.community_id === communityId
      )
    : memberships.find(
        (item) => item.role === "OWNER" ||
                  item.role === "COMMUNITY_ADMIN"
      );

  if (!membership) {
    redirect("/select-role");
  }

  if (
    membership.role !== "OWNER" &&
    membership.role !== "COMMUNITY_ADMIN"
  ) {
    redirect(`/member?communityId=${membership.community_id}`);
  }

  const activeCommunityId = membership.community_id;

  const { data: community } = await supabase
    .from("communities")
    .select("name")
    .eq("id", activeCommunityId)
    .single();

  const { data: requests, error: requestsError } =
    await supabase.rpc("list_pending_member_requests", {
      p_community_id: activeCommunityId,
    });

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href={`/dashboard?communityId=${activeCommunityId}`}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>

          <p className="mt-5 text-sm font-medium text-indigo-600">
            {community?.name ?? "Your Community"}
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Member Approval
          </h1>

          <p className="mt-2 text-gray-600">
            Review requests from people who want to join your community.
          </p>
        </div>

        {requestsError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            Could not load requests: {requestsError.message}
          </div>
        ) : (
          <MemberRequests
            requests={requests ?? []}
            communityId={activeCommunityId}
          />
        )}
      </div>
    </main>
  );
}
