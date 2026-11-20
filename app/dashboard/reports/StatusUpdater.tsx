
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type StatusUpdaterProps = {
  reportId: string;
  currentStatus: string;
};

const statuses = [
  { value: "OPEN", label: "Open" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "REJECTED", label: "Rejected" },
];

export default function StatusUpdater({
  reportId,
  currentStatus,
}: StatusUpdaterProps) {
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function updateStatus() {
    setLoading(true);
    setError("");
    setSuccess("");

    const supabase = createClient();

    const { error: updateError } = await supabase.rpc(
      "update_community_report_status",
      {
        p_report_id: reportId,
        p_new_status: status,
      }
    );

    if (updateError) {
      console.error("Status update error:", updateError);
      setError(updateError.message);
      setLoading(false);
      setStatus(currentStatus);
      return;
    }

    setSuccess("Complaint status updated.");
    setLoading(false);

    router.refresh();
  }

  return (
    <div className="mt-5 border-t border-white/10 pt-5">
      <label
        htmlFor={`status-${reportId}`}
        className="block text-sm font-semibold text-slate-200"
      >
        Update complaint status
      </label>

      <div className="mt-3 flex flex-wrap gap-3">
        <select
          id={`status-${reportId}`}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setSuccess("");
            setError("");
          }}
          disabled={loading}
          className="min-w-44 rounded-lg border border-white/15 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-60"
        >
          {statuses.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={updateStatus}
          disabled={loading || status === currentStatus}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Updating..." : "Save Status"}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-3 text-sm text-green-400">
          {success}
        </p>
      )}
    </div>
  );
}
