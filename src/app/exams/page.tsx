import Link from "next/link";
import { EXAMS } from "@/lib/exams";

export default function ExamsIndex() {
  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-ink-900">Exams & programs</h1>
      <p className="mt-1 text-sm text-ink-500">TOPIK I · II · KIIP · EPS-TOPIK · Theme</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMS.map((e) => (
          <Link key={e.id} href={`/exams/${e.id}`} className="card block p-6 transition hover:shadow-pop">
            <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-2xl bg-gradient-to-br ${e.color}`}>{e.emoji}</div>
            <div className="text-lg font-bold text-ink-900">{e.name}</div>
            <div className="text-sm text-ink-500">{e.nameEn}</div>
            <p className="mt-3 text-sm text-ink-700">{e.description}</p>
            <div className="mt-3 text-xs text-ink-500">
              {e.levelRange} · {e.wordCount.toLocaleString()} words
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
