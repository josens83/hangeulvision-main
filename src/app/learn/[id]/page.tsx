import Link from "next/link";
import { notFound } from "next/navigation";
import { SEED_WORDS, findWord } from "@/lib/words.seed";
import { WordStudy } from "@/components/WordStudy";

export function generateStaticParams() {
  return SEED_WORDS.map((w) => ({ id: w.id }));
}

export default function LearnWordPage({ params }: { params: { id: string } }) {
  const word = findWord(params.id);
  if (!word) return notFound();
  return (
    <div className="py-6">
      <Link href="/learn" className="text-sm text-brand-600 font-semibold">
        ← All words
      </Link>
      <WordStudy word={word} />
    </div>
  );
}
