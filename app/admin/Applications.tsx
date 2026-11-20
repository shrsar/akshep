
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";

type Application = {
  id: string;
  applicant_name: string;
  community_name: string;
  community_type: string;
  address: string;
  description: string;
  status: string;
  created_at: string;
};

export default function Applications({
  applications,
}: {
  applications: Application[];
}) {
  const router = useRouter();

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  async function handleApprove(application: Application) {
    const confirmed = window.confirm(
      `Approve ${application.community_name}?\n\nThe applicant will become the Community Owner.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setLoadingId(application.id);

    try {
      const supabase = createClient();

      const { error: approvalError } = await supabase.rpc(
        "approve_community_application",
        {
          p_application_id: application.id,
        }
      );

      if (approvalError) {
        setError(approvalError.message);
        return;
      }

      setSuccess(
        `${application.community_name} has been approved. The applicant has been assigned the Owner role.`
      );

      router.refresh();
    } catch (err) {
      console.error("Approval error:", err);
      setError("Something went wrong while approving the application.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReject(application: Application) {
    if (rejectionReason.trim().length < 5) {
      setError("Please provide a rejection reason of at least 5 characters.");
      return;
    }

    setError("");
    setSuccess("");
    setLoadingId(application.id);

    try {
      const supabase = createClient();

      const { error: rejectionError } = await supabase.rpc(
        "reject_community_application",
        {
          p_application_id: application.id,
          p_reason: rejectionReason.trim(),
        }
      );

      if (rejectionError) {
        setError(rejectionError.message);
        return;
      }

      setSuccess(
        `${application.community_name} has been rejected.`
      );

      setRejectingId(null);
      setRejectionReason("");

      router.refresh();
    } catch (err) {
      console.error("Rejection error:", err);
      setError("Something went wrong while rejecting the application.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section className="mt-5 space-y-5">

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          {success}
        </p>
      )}

      {applications.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <h3 className="font-semibold text-slate-900">
            No applications awaiting review
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            New community applications will appear here.
          </p>
        </div>
      ) : (
        applications.map((application) => (
          <article
            key={application.id}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {application.community_name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {application.community_type}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  application.status === "PENDING"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {application.status.replaceAll("_", " ")}
              </span>
            </div>

            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-slate-400">Applicant</p>
                <p className="mt-1 font-medium text-slate-800">
                  {application.applicant_name}
                </p>
              </div>

              <div>
                <p className="text-slate-400">Address</p>
                <p className="mt-1 font-medium text-slate-800">
                  {application.address}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-slate-400">
                  About the organisation
                </p>
                <p className="mt-1 leading-6 text-slate-700">
                  {application.description}
                </p>
              </div>

              <div>
                <p className="text-slate-400">
                  Application submitted
                </p>
                <p className="mt-1 text-slate-700">
                  {new Date(application.created_at).toLocaleDateString(
                    "en-IN",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <p className="mb-4 text-xs text-slate-400">
                Application ID: {application.id}
              </p>

              {rejectingId === application.id ? (
                <div className="space-y-3">
                  <label
                    htmlFor={`reason-${application.id}`}
                    className="block text-sm font-medium text-slate-700"
                  >
                    Reason for rejection
                  </label>

                  <textarea
                    id={`reason-${application.id}`}
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) =>
                      setRejectionReason(e.target.value)
                    }
                    placeholder="Explain why this application is being rejected..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={loadingId === application.id}
                      onClick={() => handleReject(application)}
                      className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {loadingId === application.id
                        ? "Rejecting..."
                        : "Confirm rejection"}
                    </button>

                    <button
                      type="button"
                      disabled={loadingId === application.id}
                      onClick={() => {
                        setRejectingId(null);
                        setRejectionReason("");
                        setError("");
                      }}
                      className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={loadingId === application.id}
                    onClick={() => handleApprove(application)}
                    className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingId === application.id
                      ? "Processing..."
                      : "Approve application"}
                  </button>

                  <button
                    type="button"
                    disabled={loadingId === application.id}
                    onClick={() => {
                      setRejectingId(application.id);
                      setRejectionReason("");
                      setError("");
                    }}
                    className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Reject application
                  </button>
                </div>
              )}
            </div>
          </article>
        ))
      )}
    </section>
  );
}
