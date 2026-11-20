
"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

type VerificationSummary = {
  implemented_count: number;
  not_implemented_count: number;
  total_votes: number;
};

export default function SolutionVerification({
  solutionUpdateId,
}: {
  solutionUpdateId: string;
}) {
  const supabase = createClient();

  const [summary, setSummary] = useState<VerificationSummary>({
    implemented_count: 0,
    not_implemented_count: 0,
    total_votes: 0,
  });

  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);

    const { data, error: summaryError } = await supabase.rpc(
      "get_solution_verification_summary",
      {
        p_solution_update_id: solutionUpdateId,
      }
    );

    if (summaryError) {
      setError(summaryError.message);
      setLoadingSummary(false);
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (result) {
      setSummary({
        implemented_count: Number(result.implemented_count ?? 0),
        not_implemented_count: Number(
          result.not_implemented_count ?? 0
        ),
        total_votes: Number(result.total_votes ?? 0),
      });
    }

    setLoadingSummary(false);
  }, [solutionUpdateId, supabase]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  async function submitVerification(isImplemented: boolean) {
    setLoading(true);
    setError("");
    setMessage("");

    const { error: submitError } = await supabase.rpc(
      "submit_solution_verification",
      {
        p_solution_update_id: solutionUpdateId,
        p_is_implemented: isImplemented,
        p_comment: comment.trim() || null,
      }
    );

    setLoading(false);

    if (submitError) {
      setError(submitError.message);
      return;
    }

    setMessage("Your verification has been saved.");
    setComment("");

    await loadSummary();
  }

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
      <h5 className="font-semibold text-gray-900">
        Verify Implementation
      </h5>

      <p className="mt-1 text-sm text-gray-600">
        Has this official solution actually been implemented?
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-green-50 p-3">
          <p className="text-xs text-green-700">
            Implemented
          </p>
          <p className="mt-1 text-2xl font-bold text-green-800">
            {loadingSummary ? "..." : summary.implemented_count}
          </p>
        </div>

        <div className="rounded-lg bg-red-50 p-3">
          <p className="text-xs text-red-700">
            Not implemented
          </p>
          <p className="mt-1 text-2xl font-bold text-red-800">
            {loadingSummary ? "..." : summary.not_implemented_count}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-600">
            Total verifications
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {loadingSummary ? "..." : summary.total_votes}
          </p>
        </div>
      </div>

      <label className="mt-4 block text-sm font-medium text-gray-700">
        Optional comment
      </label>

      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Share any relevant observations..."
        className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:border-indigo-500"
      />

      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading || loadingSummary}
          onClick={() => submitVerification(true)}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Implemented"}
        </button>

        <button
          type="button"
          disabled={loading || loadingSummary}
          onClick={() => submitVerification(false)}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Not Implemented"}
        </button>
      </div>

      {message && (
        <p className="mt-3 text-sm text-green-700">{message}</p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <p className="mt-3 text-xs text-gray-500">
        Your individual response is private. Only aggregate totals are displayed.
        You can change your verification later.
      </p>
    </div>
  );
}
