export default function InstallPage() {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="text-3xl font-bold text-ink-900">Install the mobile app</h1>
      <p className="mt-1 text-ink-500">
        HangeulVision AI is a Progressive Web App — installs on any phone or tablet with a single
        tap, works offline, and syncs with the web app.
      </p>

      <div className="card mt-8 p-6">
        <div className="font-semibold text-ink-900">📱 iPhone / iPad (Safari)</div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-700">
          <li>Open <code>hangeulvision.app</code> in Safari.</li>
          <li>Tap the <strong>Share</strong> icon at the bottom.</li>
          <li>Choose <strong>Add to Home Screen</strong>.</li>
          <li>Tap <strong>Add</strong>.</li>
        </ol>
      </div>

      <div className="card mt-4 p-6">
        <div className="font-semibold text-ink-900">🤖 Android (Chrome)</div>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-700">
          <li>Open <code>hangeulvision.app</code> in Chrome.</li>
          <li>Tap the <strong>⋮</strong> menu.</li>
          <li>Choose <strong>Install app</strong>.</li>
          <li>Confirm to add to your home screen.</li>
        </ol>
      </div>

      <div className="card mt-4 p-6">
        <div className="font-semibold text-ink-900">💻 Desktop (Chrome, Edge, Brave)</div>
        <p className="mt-2 text-sm text-ink-700">
          Click the install icon (⊕) to the right of the address bar to install HangeulVision AI as
          a standalone desktop app.
        </p>
      </div>

      <div className="card mt-4 p-6">
        <div className="font-semibold text-ink-900">📦 App stores (coming soon)</div>
        <p className="mt-2 text-sm text-ink-700">
          Native builds are wrapped via Capacitor — same codebase, same features. Play Store and
          App Store listings ship with the v1.0 launch.
        </p>
      </div>
    </div>
  );
}
