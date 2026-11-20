
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type OfficialSolutionFormProps = {
  reportId: string;
};

export default function OfficialSolutionForm({
  reportId,
}: OfficialSolutionFormProps) {
  const router = useRouter();

  const [solution, setSolution] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanSolution = solution.trim();

    if (cleanSolution.length < 10) {
      setError("Please enter at least 10 characters.");
      return;
    }

    if (cleanSolution.length > 5000) {
      setError("The solution cannot exceed 5000 characters.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Your session has expired. Please log in again.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("problem_solution_updates")
      .insert({
        report_id: reportId,
        published_by: user.id,
        solution_text: cleanSolution,
      });

    if (insertError) {
      console.error("Official solution publishing error:", insertError);
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSolution("");
    setSuccess("Official solution published successfully.");
    setLoading(false);

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 border-t border-white/10 pt-5"
    >
      <h4 className="text-sm font-semibold text-slate-200">
        Publish Official Solution
      </h4>

      <p className="mt-2 text-sm text-slate-400">
        Share the proposed resolution or action taken with all members
        of this community.
      </p>

      <textarea
        value={solution}
        onChange={(event) => setSolution(event.target.value)}
        placeholder="Write the official solution or update..."
        maxLength={5000}
        rows={4}
        disabled={loading}
        className="mt-3 w-full resize-y rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-60"
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {solution.length}/5000 characters
        </p>

        <button
          type="submit"
          disabled={loading || solution.trim().length < 10}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Publishing..." : "Publish to Members"}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
          {success}
        </p>
      )}
    </form>
  );
}
