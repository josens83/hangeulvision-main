export default function PrivacyPage() {
  return (
    <article className="prose prose-slate mx-auto max-w-3xl py-10">
      <h1>Privacy Policy</h1>
      <p className="text-ink-500">Last updated: April 25, 2026</p>
      <h2>1. Data We Collect</h2>
      <ul>
        <li><strong>Account info:</strong> email, name, hashed password (or Google OAuth ID).</li>
        <li><strong>Learning data:</strong> SRS progress, quiz scores, streaks, bookmarks, deck contents.</li>
        <li><strong>Payment records:</strong> processed by Paddle — we never store card numbers.</li>
        <li><strong>Usage analytics:</strong> page views and session duration (no third-party trackers).</li>
      </ul>
      <h2>2. How We Use It</h2>
      <p>To provide and improve the learning experience, schedule spaced-repetition reviews, calculate streaks and achievements, and process payments.</p>
      <h2>3. Data Retention</h2>
      <p>Account and learning data are retained while your account is active. After deletion, data is permanently removed within 30 days.</p>
      <h2>4. Third Parties</h2>
      <ul>
        <li><strong>Paddle:</strong> payment processing (their own privacy policy applies).</li>
        <li><strong>SendGrid:</strong> transactional emails only.</li>
        <li><strong>Supabase:</strong> database hosting (data stored in ap-northeast-2 / Seoul).</li>
        <li><strong>Anthropic (Claude):</strong> AI chat — your messages are not stored by Anthropic after processing.</li>
      </ul>
      <h2>5. Cookies</h2>
      <p>We use localStorage for authentication tokens and user preferences. No third-party tracking cookies.</p>
      <h2>6. Your Rights (GDPR / K-PIPA)</h2>
      <p>You may export or delete your data at any time from <a href="/account">Account Settings</a>. For data requests, email <a href="mailto:privacy@hangeulvision.app">privacy@hangeulvision.app</a>.</p>
      <h2>7. Contact</h2>
      <p>Data controller: Unipath · <a href="mailto:privacy@hangeulvision.app">privacy@hangeulvision.app</a></p>
    </article>
  );
}
