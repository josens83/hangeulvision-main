export default function TermsPage() {
  return (
    <div className="prose prose-slate mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-bold text-ink-900">Terms of Service</h1>
      <p className="text-ink-500">Last updated: {new Date().toLocaleDateString()}</p>
      <p className="mt-4 text-ink-700">
        HangeulVision AI is operated by Unipath (유니패스). By creating an account you agree to our
        fair-use, refund and subscription policies detailed below. This MVP copy is a
        placeholder — final terms will ship with v1.0 launch.
      </p>
      <h2 className="mt-6 text-xl font-semibold text-ink-900">1. Service</h2>
      <p className="text-ink-700">
        HangeulVision AI provides AI-generated Korean vocabulary learning content for TOPIK, KIIP
        and EPS-TOPIK preparation.
      </p>
      <h2 className="mt-6 text-xl font-semibold text-ink-900">2. Subscriptions</h2>
      <p className="text-ink-700">
        Monthly plans auto-renew until cancelled. You can cancel any time from your account page.
      </p>
      <h2 className="mt-6 text-xl font-semibold text-ink-900">3. Refunds</h2>
      <p className="text-ink-700">
        7-day money-back guarantee on first-month subscriptions; one-time packs are non-refundable
        after content is accessed.
      </p>
    </div>
  );
}
