import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMS, examById } from "@/lib/exams";
import { SEED_WORDS } from "@/lib/words.seed";

export function generateStaticParams() {
  return EXAMS.map((e) => ({ id: e.id }));
}

export default function ExamDetail({ params }: { params: { id: string } }) {
  const exam = examById(params.id as any);
  if (!exam) return notFound();
  const words = SEED_WORDS.filter((w) => w.exam === exam.id);

  return (
    <div className="py-6">
      <Link href="/exams" className="text-sm text-brand-600 font-semibold">← All exams</Link>
      <div className="mt-3 flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-3xl text-3xl bg-gradient-to-br ${exam.color}`}>{exam.emoji}</div>
        <div>
          <h1 className="text-3xl font-bold text-ink-900">{exam.name}</h1>
          <p className="text-ink-500">{exam.nameEn} · {exam.levelRange} · {exam.wordCount.toLocaleString()} words</p>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-ink-700">{exam.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {exam.tiers.map((t) => (
          <span key={t} className="chip">Included in {t}</span>
        ))}
        {exam.oneTimePriceUSD ? (
          <Link href={`/checkout?pack=${exam.id}`} className="chip bg-brand-500 text-white">
            One-time pack · ${exam.oneTimePriceUSD}
          </Link>
        ) : null}
      </div>
      <section className="mt-8">
        <h2 className="text-xl font-bold text-ink-900">Sample words</h2>
        <p className="text-sm text-ink-500">{words.length} seed · bulk catalog coming from the content pipeline.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {words.map((w) => (
            <Link href={`/learn/${w.id}`} key={w.id} className="card p-5 transition hover:shadow-pop">
              <div className="korean text-2xl font-bold text-ink-900">{w.word}</div>
              <div className="text-xs text-ink-500">{w.romanization}</div>
              <div className="mt-2 text-sm text-ink-700">{w.definitionEn}</div>
            </Link>
          ))}
          {!words.length ? (
            <div className="col-span-full text-sm text-ink-500">No sample words for this exam yet — check back soon.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
