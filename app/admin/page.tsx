
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import Applications from "./Applications";
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Verify the logged-in user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Verify Super Admin role
  const { data: roles, error: roleError } = await supabase
    .from("platform_roles")
    .select("role")
    .eq("user_id", user.id);

  if (roleError) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl rounded-xl bg-white p-6">
          <h1 className="text-xl font-bold text-red-700">
            Access verification failed
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            We could not verify your platform permissions.
          </p>
        </div>
      </main>
    );
  }

  const isSuperAdmin = roles?.some(
    (item) => item.role === "SUPER_ADMIN"
  );

  if (!isSuperAdmin) {
    redirect("/dashboard");
  }

  // Fetch applications awaiting review
  const {
    data: applications,
    error: applicationsError,
  } = await supabase
    .from("community_applications")
    .select(
      "id, applicant_name, community_name, community_type, address, description, status, created_at"
    )
    .in("status", ["PENDING", "UNDER_REVIEW"])
    .order("created_at", { ascending: false });

  const pendingCount =
    applications?.filter((item) => item.status === "PENDING").length ?? 0;

  const reviewCount =
    applications?.filter((item) => item.status === "UNDER_REVIEW").length ?? 0;

  return (
    <main className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            Akshep<span className="text-blue-600">.</span>
          </Link>

          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">
              Super Admin
            </p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* Heading */}
        <div>
          <p className="text-sm font-semibold text-blue-600">
            PLATFORM CONTROL CENTRE
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Super Admin Dashboard
          </h1>

          <p className="mt-2 text-slate-500">
            Manage community applications and oversee the Akshep platform.
          </p>
        </div>

        {/* Statistics */}
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Pending applications
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {applicationsError ? "—" : pendingCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Under review
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">
              {applicationsError ? "—" : reviewCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Admin account
            </p>
            <p className="mt-3 text-lg font-bold text-green-700">
              Active
            </p>
          </div>
        </section>

        {/* Application list */}
        <section className="mt-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Community applications
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review organisations requesting to join Akshep.
            </p>
          </div>

          {applicationsError ? (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700"
            >
              Could not load applications: {applicationsError.message}
            </div>
          ) : (
            <Applications applications={applications ?? []} />
          )}
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Akshep. Platform Administration.
        </footer>

      </div>
    </main>
  );
}
