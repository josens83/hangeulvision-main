import Link from "next/link";
import { SEED_WORDS } from "@/lib/words.seed";

export default function LearnIndex() {
  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-ink-900">Word library</h1>
      <p className="mt-1 text-sm text-ink-500">
        {SEED_WORDS.length} seed words. Bulk TOPIK I (2,000) arrives from the content pipeline.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SEED_WORDS.map((w) => (
          <Link href={`/learn/${w.id}`} key={w.id} className="card p-5 transition hover:shadow-pop">
            <div className="chip">{w.exam.replace("_", " ")} · L{w.level}</div>
            <div className="korean mt-3 text-3xl font-bold text-ink-900">{w.word}</div>
            <div className="mt-1 text-sm text-ink-500">{w.romanization}</div>
            <div className="mt-3 text-sm text-ink-700">{w.definitionEn}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
