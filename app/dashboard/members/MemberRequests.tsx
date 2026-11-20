
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type MemberRequest = {
  membership_id: string;
  full_name: string;
  requested_at: string;
};

export default function MemberRequests({
  requests,
  communityId,
}: {
  requests: MemberRequest[];
  communityId: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function reviewRequest(
    membershipId: string,
    decision: "APPROVED" | "REJECTED"
  ) {
    setLoadingId(membershipId);
    setError("");
    setSuccess("");

    const { error: reviewError } = await supabase.rpc(
      "review_member_request",
      {
        p_membership_id: membershipId,
        p_decision: decision,
      }
    );

    setLoadingId(null);

    if (reviewError) {
      setError(reviewError.message);
      return;
    }

    setSuccess(
      decision === "APPROVED"
        ? "Member approved successfully."
        : "Member request rejected."
    );

    router.refresh();
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </p>
      )}

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <h3 className="font-semibold text-gray-800">
            No pending member requests
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            New requests will appear here.
          </p>
        </div>
      ) : (
        requests.map((request) => (
          <div
            key={request.membership_id}
            className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="font-semibold text-gray-900">
                {request.full_name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Requested:{" "}
                {new Date(request.requested_at).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={loadingId !== null}
                onClick={() =>
                  reviewRequest(request.membership_id, "APPROVED")
                }
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {loadingId === request.membership_id
                  ? "Processing..."
                  : "Approve"}
              </button>

              <button
                type="button"
                disabled={loadingId !== null}
                onClick={() =>
                  reviewRequest(request.membership_id, "REJECTED")
                }
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
