
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import ReportRating from "./ReportRating";
import SolutionSuggestionForm from "./SolutionSuggestionForm";
import SolutionVerification from "./SolutionVerification";

type PageProps = {
  searchParams: Promise<{
    communityId?: string;
  }>;
};

type ProblemReport = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string | null;
  status: string;
  created_at: string;
};

type Priority = {
  report_id: string;
  rating_count: number;
  average_severity: number;
  priority_score: number;
};

type Rating = {
  report_id: string;
  severity: number;
};

type Response = {
  id: string;
  report_id: string;
  response: string;
  created_at: string;
};

type SolutionSuggestion = {
  id: string;
  report_id: string;
  solution_description: string;
  status: string;
  created_at: string;
  implemented_at: string | null;
};

type OfficialSolution = {
  id: string;
  report_id: string;
  solution_text: string;
  created_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default async function MemberDashboard({
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

  // Load only approved memberships.
  const { data: memberships, error: membershipError } = await supabase
    .from("memberships")
    .select("community_id, role, approval_status, communities(name)")
    .eq("user_id", user.id)
    .eq("approval_status", "APPROVED");

  if (membershipError) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900">
            Member Dashboard
          </h1>
          <p className="mt-4 text-red-600">
            Could not load your community membership:{" "}
            {membershipError.message}
          </p>
        </div>
      </main>
    );
  }

  if (!memberships || memberships.length === 0) {
    redirect("/select-organization");
  }

  const membership = communityId
    ? memberships.find((item) => item.community_id === communityId)
    : memberships.find((item) => item.role === "MEMBER") ?? memberships[0];

  if (!membership) {
    redirect("/select-role");
  }

  const activeCommunityId = membership.community_id;

  const communityData = membership.communities as
    | { name: string }
    | { name: string }[]
    | null;

  const communityName = Array.isArray(communityData)
    ? communityData[0]?.name ?? "Your Community"
    : communityData?.name ?? "Your Community";

  // Do not fetch created_by: complainant identities remain private.
  const { data: reports, error: reportsError } = await supabase
    .from("problem_reports")
    .select(
      "id, title, description, category, location, status, created_at"
    )
    .eq("community_id", activeCommunityId)
    .order("created_at", { ascending: false });

  if (reportsError) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl rounded-xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-gray-900">
            Member Dashboard
          </h1>
          <p className="mt-4 text-red-600">
            Could not load complaints: {reportsError.message}
          </p>
        </div>
      </main>
    );
  }

  const reportList = (reports ?? []) as ProblemReport[];
  const reportIds = reportList.map((report) => report.id);

  let priorities: Priority[] = [];
  let ratings: Rating[] = [];
  let responses: Response[] = [];
  let suggestions: SolutionSuggestion[] = [];
  let officialSolutions: OfficialSolution[] = [];

  const dataErrors: string[] = [];

  if (reportIds.length > 0) {
    const [
      priorityResult,
      ratingResult,
      responseResult,
      suggestionResult,
      officialResult,
    ] = await Promise.all([
      supabase
        .from("problem_report_priorities")
        .select(
          "report_id, rating_count, average_severity, priority_score"
        )
        .eq("community_id", activeCommunityId),

      supabase
        .from("problem_ratings")
        .select("report_id, severity")
        .eq("user_id", user.id)
        .in("report_id", reportIds),

      supabase
        .from("problem_responses")
        .select("id, report_id, response, created_at")
        .in("report_id", reportIds)
        .order("created_at", { ascending: true }),

      supabase
        .from("problem_solutions")
        .select(
          "id, report_id, solution_description, status, created_at, implemented_at"
        )
        .in("report_id", reportIds)
        .order("created_at", { ascending: true }),

      supabase
        .from("problem_solution_updates")
        .select("id, report_id, solution_text, created_at")
        .in("report_id", reportIds)
        .order("created_at", { ascending: true }),
    ]);

    if (priorityResult.error) {
      dataErrors.push(
        `Priority scores: ${priorityResult.error.message}`
      );
    } else {
      priorities = (priorityResult.data ?? []) as Priority[];
    }

    if (ratingResult.error) {
      dataErrors.push(
        `Your ratings: ${ratingResult.error.message}`
      );
    } else {
      ratings = (ratingResult.data ?? []) as Rating[];
    }

    if (responseResult.error) {
      dataErrors.push(
        `Administrator responses: ${responseResult.error.message}`
      );
    } else {
      responses = (responseResult.data ?? []) as Response[];
    }

    if (suggestionResult.error) {
      dataErrors.push(
        `Solution suggestions: ${suggestionResult.error.message}`
      );
    } else {
      suggestions = (suggestionResult.data ?? []) as SolutionSuggestion[];
    }

    if (officialResult.error) {
      dataErrors.push(
        `Official solutions: ${officialResult.error.message}`
      );
    } else {
      officialSolutions = (officialResult.data ?? []) as OfficialSolution[];
    }
  }

  const priorityMap = new Map(
    priorities.map((item) => [item.report_id, item])
  );

  const ratingMap = new Map(
    ratings.map((item) => [item.report_id, item.severity])
  );

  const responsesMap = new Map<string, Response[]>();

  for (const response of responses) {
    const existing = responsesMap.get(response.report_id) ?? [];
    existing.push(response);
    responsesMap.set(response.report_id, existing);
  }

  const suggestionsMap = new Map<string, SolutionSuggestion[]>();

  for (const suggestion of suggestions) {
    const existing = suggestionsMap.get(suggestion.report_id) ?? [];
    existing.push(suggestion);
    suggestionsMap.set(suggestion.report_id, existing);
  }

  const officialSolutionsMap = new Map<string, OfficialSolution[]>();

  for (const solution of officialSolutions) {
    const existing =
      officialSolutionsMap.get(solution.report_id) ?? [];
    existing.push(solution);
    officialSolutionsMap.set(solution.report_id, existing);
  }

  // Highest priority complaints appear first.
  const sortedReports = [...reportList].sort((a, b) => {
    const scoreA = priorityMap.get(a.id)?.priority_score ?? 0;
    const scoreB = priorityMap.get(b.id)?.priority_score ?? 0;
    return scoreB - scoreA;
  });

  const communityQuery = `?communityId=${activeCommunityId}`;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              {communityName}
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Member Dashboard
            </h1>

            <p className="mt-2 text-gray-600">
              Report problems, rate their severity and suggest solutions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/report${communityQuery}`}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700"
            >
              Report a Problem
            </Link>

            <Link
              href="/select-role"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
            >
              Switch Role
            </Link>
          </div>
        </header>

        {/* Dashboard statistics */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Complaints</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {reportList.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Open Complaints</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {
                reportList.filter(
                  (report) =>
                    report.status === "OPEN" ||
                    report.status === "UNDER_REVIEW"
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Resolved Complaints</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {
                reportList.filter(
                  (report) => report.status === "RESOLVED"
                ).length
              }
            </p>
          </div>
        </section>

        {/* Data loading errors */}
        {dataErrors.length > 0 && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <h2 className="font-semibold text-amber-900">
              Some dashboard information could not be loaded
            </h2>

            <ul className="mt-2 list-disc pl-5 text-sm text-amber-800">
              {dataErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Complaint feed */}
        <section>
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-gray-900">
              Community Complaints
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Complaints are ranked by their community priority score.
            </p>
          </div>

          {sortedReports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <h3 className="text-lg font-semibold text-gray-800">
                No complaints yet
              </h3>

              <p className="mt-2 text-gray-500">
                Be the first to report a problem in this community.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedReports.map((report, index) => {
                const priority = priorityMap.get(report.id);
                const reportResponses =
                  responsesMap.get(report.id) ?? [];
                const reportSuggestions =
                  suggestionsMap.get(report.id) ?? [];
                const reportOfficialSolutions =
                  officialSolutionsMap.get(report.id) ?? [];
                const mySeverity = ratingMap.get(report.id);

                return (
                  <article
                    key={report.id}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                            Priority #{index + 1}
                          </p>

                          <h3 className="mt-2 text-xl font-bold text-gray-900">
                            {report.title}
                          </h3>
                        </div>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                          {statusLabel(report.status)}
                        </span>
                      </div>

                      <p className="mt-4 whitespace-pre-wrap text-gray-700">
                        {report.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                        <span>Category: {report.category}</span>

                        {report.location && (
                          <span>Location: {report.location}</span>
                        )}

                        <span>
                          Reported: {formatDate(report.created_at)}
                        </span>
                      </div>

                      {/* Priority statistics */}
                      <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-gray-500">
                            Priority Score
                          </p>

                          <p className="mt-1 text-xl font-bold text-gray-900">
                            {priority?.priority_score?.toFixed(2) ?? "0.00"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Average Severity
                          </p>

                          <p className="mt-1 text-xl font-bold text-gray-900">
                            {priority?.average_severity?.toFixed(2) ?? "0.00"}
                            /5
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Number of Ratings
                          </p>

                          <p className="mt-1 text-xl font-bold text-gray-900">
                            {priority?.rating_count ?? 0}
                          </p>
                        </div>
                      </div>

                      {/* Member rating */}
                      <div className="mt-5">
                        <ReportRating
                          reportId={report.id}
                          initialSeverity={mySeverity ?? null}
                        />
                      </div>

                      {/* Anonymous solution suggestions */}
                      <div className="mt-6 border-t border-gray-200 pt-5">
                        <h4 className="font-semibold text-gray-900">
                          Community Solution Suggestions
                        </h4>

                        {reportSuggestions.length === 0 ? (
                          <p className="mt-2 text-sm text-gray-500">
                            No solution suggestions yet.
                          </p>
                        ) : (
                          <div className="mt-3 space-y-3">
                            {reportSuggestions.map((suggestion) => (
                              <div
                                key={suggestion.id}
                                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                              >
                                <p className="whitespace-pre-wrap text-sm text-gray-700">
                                  {suggestion.solution_description}
                                </p>

                                <p className="mt-2 text-xs text-gray-500">
                                  Suggested: {formatDate(suggestion.created_at)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4">
                          <SolutionSuggestionForm reportId={report.id} />
                        </div>
                      </div>

                      {/* Administrator responses */}
                      <div className="mt-6 border-t border-gray-200 pt-5">
                        <h4 className="font-semibold text-gray-900">
                          Community Admin Responses
                        </h4>

                        {reportResponses.length === 0 ? (
                          <p className="mt-2 text-sm text-gray-500">
                            No administrator responses yet.
                          </p>
                        ) : (
                          <div className="mt-3 space-y-3">
                            {reportResponses.map((response) => (
                              <div
                                key={response.id}
                                className="rounded-lg border border-blue-200 bg-blue-50 p-4"
                              >
                                <p className="whitespace-pre-wrap text-sm text-gray-800">
                                  {response.response}
                                </p>

                                <p className="mt-2 text-xs text-gray-500">
                                  {formatDate(response.created_at)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Official solutions and member verification */}
                      <div className="mt-6 border-t border-gray-200 pt-5">
                        <h4 className="font-semibold text-gray-900">
                          Official Solutions
                        </h4>

                        <p className="mt-1 text-sm text-gray-500">
                          Solutions officially published by your Community Admin.
                        </p>

                        {reportOfficialSolutions.length === 0 ? (
                          <p className="mt-3 text-sm text-gray-500">
                            No official solution has been published yet.
                          </p>
                        ) : (
                          <div className="mt-3 space-y-4">
                            {reportOfficialSolutions.map((solution) => (
                              <div
                                key={solution.id}
                                className="rounded-lg border border-green-200 bg-green-50 p-4"
                              >
                                <p className="whitespace-pre-wrap text-sm text-gray-800">
                                  {solution.solution_text}
                                </p>

                                <p className="mt-2 text-xs text-gray-500">
                                  Published: {formatDate(solution.created_at)}
                                </p>

                                <SolutionVerification
                                  solutionUpdateId={solution.id}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
