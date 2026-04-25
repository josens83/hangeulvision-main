import Link from "next/link";

export default function CheckoutSuccess() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="relative mx-auto h-24 w-24">
        <div className="absolute inset-0 animate-ping rounded-full bg-brand-200 opacity-30" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-brand-500 text-5xl text-white shadow-pop">
          🎉
        </div>
      </div>
      <h1 className="mt-6 text-3xl font-bold text-ink-900">Payment successful!</h1>
      <p className="mt-2 text-ink-500">
        Your subscription is now active. All premium content is unlocked.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3">
        <Link href="/dashboard" className="btn-primary w-full max-w-xs">
          Start learning
        </Link>
        <Link href="/vocabulary" className="btn-outline w-full max-w-xs">
          Browse vocabulary
        </Link>
      </div>
      <p className="mt-6 text-xs text-ink-500">
        Need help? <Link href="/contact" className="font-semibold text-brand-600">Contact support</Link>
      </p>
    </div>
  );
}
