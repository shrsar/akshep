
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import ResponseForm from "./ResponseForm";
import StatusUpdater from "./StatusUpdater";
import OfficialSolutionForm from "./OfficialSolutionForm";

type ReportsPageProps = {
  searchParams: Promise<{
    communityId?: string;
  }>;
};

type ProblemResponse = {
  id: string;
  report_id: string;
  response: string;
  created_at: string;
};

type ProblemSolution = {
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

export default async function CommunityReportsPage({
  searchParams,
}: ReportsPageProps) {
  const { communityId } = await searchParams;
  const supabase = await createClient();

  // 1. Verify login
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  if (!communityId) {
    redirect("/select-role");
  }

  // 2. Verify community role
  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("role, community_id")
    .eq("user_id", user.id)
    .eq("community_id", communityId)
    .maybeSingle();

  if (membershipError) {
    console.error("Membership error:", membershipError);
    return <ErrorMessage message="Unable to verify your community access." />;
  }

  if (!membership || !["OWNER", "COMMUNITY_ADMIN"].includes(membership.role)) {
    redirect(`/dashboard?communityId=${encodeURIComponent(communityId)}`);
  }

  // 3. Fetch community
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("id, name")
    .eq("id", communityId)
    .maybeSingle();

  if (communityError || !community) {
    return <ErrorMessage message="Unable to load this community." />;
  }

  // 4. Fetch complaints assigned to community administrators
  const { data: reports, error: reportsError } = await supabase
    .from("problem_reports")
    .select(
      "id, title, description, category, location, status, created_at, submitted_by_role"
    )
    .eq("community_id", communityId)
    .eq("routing_target", "COMMUNITY_ADMIN")
    .order("created_at", { ascending: false });

  if (reportsError) {
    console.error("Reports query error:", reportsError);
    return (
      <ErrorMessage message="Unable to load complaints. Check your database permissions and RLS policies." />
    );
  }

  const reportIds = (reports ?? []).map((report) => report.id);

  let responses: ProblemResponse[] = [];
  let solutions: ProblemSolution[] = [];
  let officialSolutions: OfficialSolution[] = [];

  let responseError = false;
  let solutionError = false;
  let officialSolutionError = false;

  // 5. Fetch responses, anonymous suggestions and official solutions
  if (reportIds.length > 0) {
    const { data, error } = await supabase
      .from("problem_responses")
      .select("id, report_id, response, created_at")
      .in("report_id", reportIds)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Responses query error:", error);
      responseError = true;
    } else {
      responses = (data ?? []) as ProblemResponse[];
    }

    const { data: solutionData, error: solutionQueryError } =
      await supabase
        .from("problem_solutions")
        .select(
          "id, report_id, solution_description, status, created_at, implemented_at"
        )
        .in("report_id", reportIds)
        .order("created_at", { ascending: true });

    if (solutionQueryError) {
      console.error("Suggestions query error:", solutionQueryError);
      solutionError = true;
    } else {
      solutions = (solutionData ?? []) as ProblemSolution[];
    }

    const {
      data: officialData,
      error: officialQueryError,
    } = await supabase
      .from("problem_solution_updates")
      .select("id, report_id, solution_text, created_at")
      .in("report_id", reportIds)
      .order("created_at", { ascending: true });

    if (officialQueryError) {
      console.error("Official solutions query error:", officialQueryError);
      officialSolutionError = true;
    } else {
      officialSolutions = (officialData ?? []) as OfficialSolution[];
    }
  }

  // 6. Group records by complaint
  const responsesByReport = new Map<string, ProblemResponse[]>();
  const solutionsByReport = new Map<string, ProblemSolution[]>();
  const officialByReport = new Map<string, OfficialSolution[]>();

  for (const item of responses) {
    const existing = responsesByReport.get(item.report_id) ?? [];
    existing.push(item);
    responsesByReport.set(item.report_id, existing);
  }

  for (const item of solutions) {
    const existing = solutionsByReport.get(item.report_id) ?? [];
    existing.push(item);
    solutionsByReport.set(item.report_id, existing);
  }

  for (const item of officialSolutions) {
    const existing = officialByReport.get(item.report_id) ?? [];
    existing.push(item);
    officialByReport.set(item.report_id, existing);
  }

  // 7. Calculate complaint counts
  const openCount =
    reports?.filter((report) => report.status === "OPEN").length ?? 0;

  const inProgressCount =
    reports?.filter((report) => report.status === "IN_PROGRESS").length ?? 0;

  const resolvedCount =
    reports?.filter((report) => report.status === "RESOLVED").length ?? 0;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/dashboard?communityId=${community.id}`}
          className="text-sm text-blue-400 hover:underline"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-8">
          <p className="text-sm font-medium uppercase tracking-wider text-blue-400">
            {community.name}
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Community Complaint Inbox
          </h1>

          <p className="mt-3 text-slate-400">
            Review anonymous complaints and suggestions, respond and publish
            official solutions.
          </p>
        </div>

        {/* Summary */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Open" count={openCount} />
          <SummaryCard label="In Progress" count={inProgressCount} />
          <SummaryCard label="Resolved" count={resolvedCount} />
        </div>

        {/* Complaints */}
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              Received Complaints
            </h2>
            <span className="text-sm text-slate-400">
              {reports?.length ?? 0} total
            </span>
          </div>

          {responseError && (
            <ErrorNotice message="Existing administrator responses could not be loaded." />
          )}

          {solutionError && (
            <ErrorNotice message="Anonymous community suggestions could not be loaded." />
          )}

          {officialSolutionError && (
            <ErrorNotice message="Official solutions could not be loaded." />
          )}

          {!reports || reports.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
              <h3 className="text-lg font-semibold">No complaints yet</h3>
              <p className="mt-2 text-sm text-slate-400">
                Member and moderator complaints will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {reports.map((report) => {
                const reportResponses =
                  responsesByReport.get(report.id) ?? [];

                const reportSolutions =
                  solutionsByReport.get(report.id) ?? [];

                const reportOfficialSolutions =
                  officialByReport.get(report.id) ?? [];

                return (
                  <article
                    key={report.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    {/* Complaint */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {report.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {report.category}
                          {report.location ? ` • ${report.location}` : ""}
                        </p>
                      </div>

                      <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">
                        {report.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                      {report.description}
                    </p>

                    <div className="mt-5 flex flex-wrap justify-between gap-2 border-t border-white/10 pt-4 text-xs text-slate-500">
                      <span>
                        Submitted by:{" "}
                        {report.submitted_by_role?.replaceAll("_", " ") ??
                          "Community member"}
                      </span>
                      <span>
                        {new Date(report.created_at).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Status */}
                    <StatusUpdater
                      reportId={report.id}
                      currentStatus={report.status}
                    />

                    {/* Anonymous suggestions */}
                    <div className="mt-5 border-t border-white/10 pt-5">
                      <h4 className="text-sm font-semibold text-slate-200">
                        Anonymous community suggestions ({reportSolutions.length})
                      </h4>

                      {reportSolutions.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">
                          No suggestions have been submitted yet.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {reportSolutions.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-xl border border-white/10 bg-slate-900/70 p-4"
                            >
                              <span className="text-xs font-semibold text-blue-300">
                                Anonymous member suggestion
                              </span>
                              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">
                                {item.solution_description}
                              </p>
                              <p className="mt-3 text-xs text-slate-500">
                                {new Date(item.created_at).toLocaleString("en-IN")}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Administrator responses */}
                    <div className="mt-5 border-t border-white/10 pt-5">
                      <h4 className="text-sm font-semibold text-slate-200">
                        Administrator responses ({reportResponses.length})
                      </h4>

                      {reportResponses.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">
                          No administrator responses yet.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {reportResponses.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4"
                            >
                              <p className="whitespace-pre-wrap text-sm text-slate-300">
                                {item.response}
                              </p>
                              <p className="mt-3 text-xs text-slate-500">
                                {new Date(item.created_at).toLocaleString("en-IN")}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <ResponseForm reportId={report.id} />

                    {/* Official solutions */}
                    <div className="mt-5 border-t border-white/10 pt-5">
                      <h4 className="text-sm font-semibold text-slate-200">
                        Official solutions ({reportOfficialSolutions.length})
                      </h4>

                      {reportOfficialSolutions.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-500">
                          No official solution has been published yet.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-3">
                          {reportOfficialSolutions.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-xl border border-green-500/20 bg-green-500/5 p-4"
                            >
                              <span className="text-xs font-semibold text-green-300">
                                Official Community Admin update
                              </span>
                              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">
                                {item.solution_text}
                              </p>
                              <p className="mt-3 text-xs text-slate-500">
                                Published:{" "}
                                {new Date(item.created_at).toLocaleString("en-IN")}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <OfficialSolutionForm reportId={report.id} />
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

function SummaryCard({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{count}</p>
    </div>
  );
}

function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
      {message}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-slate-400">{message}</p>
      <Link
        href="/select-role"
        className="mt-6 inline-block text-blue-400 underline"
      >
        Back to role selection
      </Link>
    </main>
  );
}
