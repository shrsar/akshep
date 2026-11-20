
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type SolutionFormProps = {
  reportId: string;
};

export default function SolutionForm({
  reportId,
}: SolutionFormProps) {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanDescription = description.trim();

    if (cleanDescription.length < 10) {
      setError("Please provide at least 10 characters.");
      return;
    }

    if (cleanDescription.length > 5000) {
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
      .from("problem_solutions")
      .insert({
        report_id: reportId,
        proposed_by: user.id,
        solution_description: cleanDescription,
        status: "PROPOSED",
      });

    if (insertError) {
      console.error("Solution proposal error:", insertError);
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setDescription("");
    setSuccess("Solution proposal submitted successfully.");
    setLoading(false);

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 border-t border-white/10 pt-5"
    >
      <label
        htmlFor={`solution-${reportId}`}
        className="block text-sm font-semibold text-slate-200"
      >
        Propose a solution
      </label>

      <textarea
        id={`solution-${reportId}`}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Describe how this problem can be resolved..."
        maxLength={5000}
        rows={4}
        disabled={loading}
        className="mt-3 w-full resize-y rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-60"
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {description.length}/5000 characters
        </p>

        <button
          type="submit"
          disabled={loading || description.trim().length < 10}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Propose Solution"}
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
