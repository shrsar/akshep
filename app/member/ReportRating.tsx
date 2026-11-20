
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

type ReportRatingProps = {
  reportId: string;
  initialSeverity: number | null;
};

export default function ReportRating({
  reportId,
  initialSeverity,
}: ReportRatingProps) {
  const router = useRouter();

  const [rating, setRating] = useState<number | null>(initialSeverity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submitRating(severity: number) {
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Please log in to rate this complaint.");
      setLoading(false);
      return;
    }

    const { error: ratingError } = await supabase
      .from("problem_ratings")
      .upsert(
        {
          report_id: reportId,
          user_id: user.id,
          severity,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "report_id,user_id",
        }
      );

    if (ratingError) {
      console.error("Rating submission error:", ratingError);
      setError("Unable to save your rating. Please try again.");
      setLoading(false);
      return;
    }

    setRating(severity);
    setMessage("Your rating has been saved.");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <p className="text-sm font-medium text-slate-300">
        Rate this complaint's severity
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={loading}
            onClick={() => submitRating(value)}
            aria-label={`Rate severity ${value} out of 5`}
            aria-pressed={rating === value}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              rating === value
                ? "border-blue-400 bg-blue-500 text-white"
                : "border-white/15 bg-white/5 text-slate-300 hover:border-blue-400 hover:bg-blue-500/10"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        1 = Low severity · 5 = Critical severity
      </p>

      {loading && (
        <p className="mt-2 text-xs text-blue-300">
          Saving your rating...
        </p>
      )}

      {message && (
        <p className="mt-2 text-xs text-green-400">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
