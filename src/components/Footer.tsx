import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 text-sm text-ink-500 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm leading-relaxed">
            AI-powered Korean vocabulary for TOPIK, KIIP and EPS. Built on the
            VocaVision AI platform by Unipath.{" "}
            <span className="font-medium text-ink-900">Korean, Visualized.</span>
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="https://vocavision.app"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-brand-300"
            >
              VocaVision AI
            </a>
            <a
              href="https://josens83-kanjivision-main.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-brand-300"
            >
              KanjiVision AI
            </a>
          </div>
        </div>
        <div>
          <div className="mb-2 font-semibold text-ink-900">Product</div>
          <ul className="space-y-1.5">
            <li><Link href="/exams" className="hover:text-brand-600">Exams</Link></li>
            <li><Link href="/learn" className="hover:text-brand-600">Learn</Link></li>
            <li><Link href="/pricing" className="hover:text-brand-600">Pricing</Link></li>
            <li><Link href="/install" className="hover:text-brand-600">Mobile app</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-ink-900">Company</div>
          <ul className="space-y-1.5">
            <li>Unipath &middot; 유니패스</li>
            <li><Link href="/legal/terms" className="hover:text-brand-600">Terms</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-brand-600">Privacy</Link></li>
            <li><Link href="/contact" className="hover:text-brand-600">Contact</Link></li>
            <li><Link href="/cs" className="hover:text-brand-600">Help / FAQ</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 text-center text-xs text-ink-500">
        &copy; {new Date().getFullYear()} Unipath. All rights reserved.
      </div>
    </footer>
  );
}
