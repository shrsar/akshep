
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type ResponseFormProps = {
  reportId: string;
};

export default function ResponseForm({
  reportId,
}: ResponseFormProps) {
  const router = useRouter();

  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanResponse = response.trim();

    if (!cleanResponse) {
      setError("Please enter a response.");
      return;
    }

    if (cleanResponse.length > 5000) {
      setError("Your response cannot exceed 5000 characters.");
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
      .from("problem_responses")
      .insert({
        report_id: reportId,
        responder_id: user.id,
        response: cleanResponse,
      });

    if (insertError) {
      console.error("Response submission error:", insertError);
      setError(
        "Unable to submit your response. Check your permissions and try again."
      );
      setLoading(false);
      return;
    }

    setResponse("");
    setSuccess("Your response has been submitted.");
    setLoading(false);

    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 border-t border-white/10 pt-5"
    >
      <label
        htmlFor={`response-${reportId}`}
        className="block text-sm font-semibold text-slate-200"
      >
        Administrator response
      </label>

      <textarea
        id={`response-${reportId}`}
        value={response}
        onChange={(event) => setResponse(event.target.value)}
        placeholder="Write an update or response to this complaint..."
        maxLength={5000}
        rows={4}
        disabled={loading}
        className="mt-3 w-full resize-y rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-60"
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {response.length}/5000 characters
        </p>

        <button
          type="submit"
          disabled={loading || !response.trim()}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Response"}
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
