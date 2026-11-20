
const problems = [
  {
    id: "AK-104",
    title: "Gym equipment not functioning",
    community: "K2 Gym",
    category: "Equipment",
    severity: 4.8,
    votes: 42,
    status: "In progress",
    color: "bg-amber-100 text-amber-800",
  },
  {
    id: "AK-108",
    title: "Water supply interruption",
    community: "ABC Residential Society",
    category: "Facilities",
    severity: 4.6,
    votes: 67,
    status: "Awaiting response",
    color: "bg-red-100 text-red-800",
  },
  {
    id: "AK-112",
    title: "Request for extended store hours",
    community: "Durga Stores",
    category: "Suggestion",
    severity: 3.2,
    votes: 19,
    status: "Open",
    color: "bg-blue-100 text-blue-800",
  },
];

const features = [
  {
    number: "01",
    title: "Report problems",
    description:
      "Submit problems using text, images, video or audio. Make sure every issue gets documented.",
  },
  {
    number: "02",
    title: "Collective prioritisation",
    description:
      "Members rate the severity of problems. The community helps determine what needs attention first.",
  },
  {
    number: "03",
    title: "Accountable resolution",
    description:
      "Administrators respond with solutions. Members evaluate whether those solutions actually work.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F8F9FC] text-[#172033]">
      {/* Navigation */}
      <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="text-2xl font-black tracking-tight text-[#27245F]">
            AKSHEP<span className="text-violet-500">.</span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#how-it-works" className="hover:text-violet-700">How it works</a>
            <a href="#features" className="hover:text-violet-700">Features</a>
            <a href="#problems" className="hover:text-violet-700">Explore problems</a>
          </div>

          <div className="flex items-center gap-3">
            <a href="/login" className="hidden text-sm font-semibold text-slate-700 sm:block">
              Log in
            </a>
            <a
              href="/register"
              className="rounded-lg bg-[#27245F] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-900"
            >
              Get started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-800">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            COMMUNITY-DRIVEN ACCOUNTABILITY
          </div>

          <h1 className="max-w-2xl text-5xl font-bold leading-[1.12] tracking-tight sm:text-6xl">
            Every problem
            <br />
            deserves to be
            <span className="text-violet-700"> heard.</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">
            Akshep gives communities a structured way to raise problems,
            collectively prioritise them and hold administrators accountable
            for real solutions.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="/register"
              className="rounded-xl bg-[#27245F] px-7 py-4 font-semibold text-white shadow-lg shadow-indigo-950/10 transition hover:-translate-y-0.5 hover:bg-violet-900"
            >
              Create your account →
            </a>
            <a
              href="#how-it-works"
              className="rounded-xl border border-slate-300 bg-white px-7 py-4 font-semibold text-slate-700 transition hover:border-violet-400"
            >
              Discover how it works
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-500">
            <span>✓ Community-focused</span>
            <span>✓ Transparent priorities</span>
            <span>✓ Verified solutions</span>
          </div>
        </div>

        {/* Product preview */}
        <div id="problems" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-300/40 sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Community overview
              </p>
              <h2 className="mt-1 text-xl font-bold">K2 Gym</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              Community active
            </span>
          </div>

          <div className="my-6 grid grid-cols-3 gap-3">
            {[
              ["24", "Open issues"],
              ["08", "In progress"],
              ["42", "Resolved"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3">
                <p className="text-2xl font-bold">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold">Priority queue</h3>
            <span className="text-xs font-medium text-violet-700">Highest priority</span>
          </div>

          <div className="space-y-3">
            {problems.map((problem, index) => (
              <div key={problem.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="text-sm font-bold text-slate-400">
                      0{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{problem.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {problem.community} · {problem.category}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-violet-700">
                    {problem.severity.toFixed(1)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${problem.color}`}>
                    {problem.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {problem.votes} ratings
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            Illustrative product preview · Sample data
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-violet-700">
              The Akshep process
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              From raising a problem to resolving it.
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Every problem follows a transparent process, giving members
              visibility and administrators responsibility.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.number} className="rounded-2xl border border-slate-200 p-7 transition hover:-translate-y-1 hover:shadow-lg">
                <span className="text-sm font-bold text-violet-600">{feature.number}</span>
                <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-[#27245F] px-8 py-16 text-center text-white sm:px-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-200">
            Make your community better
          </p>
          <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
            Don't let problems go unheard.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-indigo-100">
            Join a community or create one of your own. Make problem-solving
            more transparent, organised and accountable.
          </p>
          <a
            href="/register"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-4 font-bold text-[#27245F] transition hover:bg-violet-50"
          >
            Get started with Akshep →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-6 py-8 sm:flex-row sm:items-center">
          <span className="text-xl font-black tracking-tight text-[#27245F]">
            AKSHEP.
          </span>
          <p className="text-sm text-slate-500">
            Every problem deserves to be heard.
          </p>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Akshep
          </p>
        </div>
      </footer>
    </main>
  );
}
