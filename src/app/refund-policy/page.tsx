import Link from "next/link";

export default function RefundPolicyPage() {
  return (
    <article className="prose prose-slate mx-auto max-w-3xl py-10">
      <h1>Refund Policy</h1>
      <p className="text-ink-500">Last updated: April 25, 2026</p>
      <h2>Subscriptions</h2>
      <p>You may request a full refund within <strong>7 days</strong> of your first subscription payment. After 7 days, no refund is available for the current billing period, but you may cancel to prevent future charges.</p>
      <h2>One-Time Purchases</h2>
      <p>Digital content packs (TOPIK II, EPS-TOPIK) are <strong>non-refundable</strong> once accessed, as they are instant-delivery digital products.</p>
      <h2>How to Request a Refund</h2>
      <ol>
        <li>Email <a href="mailto:billing@hangeulvision.app">billing@hangeulvision.app</a> with your account email and purchase date.</li>
        <li>Or submit a ticket via <Link href="/contact">Contact</Link>.</li>
        <li>Refunds are processed within 5-10 business days to the original payment method.</li>
      </ol>
      <h2>Exceptions</h2>
      <p>If you experience a technical issue preventing access to paid content, contact us and we will either resolve the issue or provide a full refund regardless of the 7-day window.</p>
    </article>
  );
}
