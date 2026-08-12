import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

const features = [
  {
    title: "See the whole board",
    body: "Three clear columns. Every task has a home. No hunting through lists.",
  },
  {
    title: "Move work in one click",
    body: "Drag the status from To Do to In Progress to Done. The board updates for everyone.",
  },
  {
    title: "It actually saves",
    body: "Cards live in a real database. Refresh the page — your work is still there.",
  },
];

const steps = [
  { n: "01", title: "Register", body: "Create a free account in under a minute." },
  { n: "02", title: "Add tasks", body: "Type a title, drop it on the board." },
  { n: "03", title: "Ship", body: "Move cards as work happens. Done is visible." },
];

export default function LandingPage() {
  return (
    <div className="min-h-full">
      <SiteHeader />

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
            Kanban for people who ship
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
            Stop losing tasks.
            <br />
            Watch them move.
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-stone-600">
            Task Management Board is a focused kanban. Add a card, move it, finish it.
            Built for small teams who don&apos;t need a 40-page tool.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-teal-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-900"
            >
              Register free
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Login
            </Link>
          </div>
          <p className="mt-4 text-xs text-stone-500">No credit card. Open the board in seconds.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-3xl border border-stone-200 bg-stone-100/80 p-4 shadow-sm">
          {[
            { name: "To Do", tint: "border-t-stone-400" },
            { name: "In Progress", tint: "border-t-amber-400" },
            { name: "Done", tint: "border-t-teal-600" },
          ].map((col) => (
            <div
              key={col.name}
              className={`rounded-2xl border border-stone-200 border-t-4 bg-stone-50 p-3 ${col.tint}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                {col.name}
              </p>
              <div className="mt-6 rounded-lg border border-dashed border-stone-200 bg-white/60 px-2 py-6 text-center text-[11px] text-stone-400">
                Empty
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-stone-200 bg-[#f7f4ef] p-5"
              >
                <h3 className="text-sm font-semibold text-stone-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-stone-900">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="font-mono text-xs text-teal-800">{step.n}</p>
              <h3 className="mt-2 text-sm font-semibold text-stone-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-stone-200 bg-teal-900">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-white">Ready to clear the backlog?</h2>
            <p className="mt-2 text-sm text-teal-100">
              Register, open the board, add your first card.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-teal-900 hover:bg-teal-50"
            >
              Register
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
