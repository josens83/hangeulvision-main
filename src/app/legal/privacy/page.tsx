export default function PrivacyPage() {
  return (
    <div className="prose prose-slate mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-bold text-ink-900">Privacy Policy</h1>
      <p className="text-ink-500">Last updated: {new Date().toLocaleDateString()}</p>
      <p className="mt-4 text-ink-700">
        We collect only what's needed to run the service: account email, learning progress, and
        payment records. We do not sell personal data. This MVP copy is a placeholder — final
        GDPR / K-PIPA text ships with v1.0.
      </p>
      <h2 className="mt-6 text-xl font-semibold text-ink-900">Data we store</h2>
      <ul className="list-disc pl-5 text-ink-700">
        <li>Account info (email, name, hashed password).</li>
        <li>SRS review history and streaks.</li>
        <li>Payment records from TossPayments / Paddle (card numbers never touch our servers).</li>
      </ul>
      <h2 className="mt-6 text-xl font-semibold text-ink-900">Your rights</h2>
      <p className="text-ink-700">
        You may export or delete your account from your settings page, or email
        privacy@hangeulvision.app.
      </p>
    </div>
  );
}
