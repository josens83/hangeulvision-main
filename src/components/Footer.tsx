import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 text-sm text-ink-500 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm">
            AI-powered Korean vocabulary for TOPIK, KIIP and EPS. Built on the VocaVision AI
            platform by Unipath. <span className="text-ink-900 font-medium">Korean, Visualized.</span>
          </p>
        </div>
        <div>
          <div className="mb-2 text-ink-900 font-semibold">Product</div>
          <ul className="space-y-1.5">
            <li><Link href="/exams">Exams</Link></li>
            <li><Link href="/learn">Learn</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/install">Mobile app</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-2 text-ink-900 font-semibold">Company</div>
          <ul className="space-y-1.5">
            <li>Unipath · 유니패스</li>
            <li><Link href="/legal/terms">Terms</Link></li>
            <li><Link href="/legal/privacy">Privacy</Link></li>
            <li><Link href="/admin">Admin</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 text-center text-xs text-ink-500">
        © {new Date().getFullYear()} Unipath. All rights reserved.
      </div>
    </footer>
  );
}
