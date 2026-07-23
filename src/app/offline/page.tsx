export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 text-center">
      <div>
        <h1 className="font-display text-5xl text-[var(--color-text)]">You are offline</h1>
        <p className="mt-4 text-[var(--color-text-muted)]">Reconnect to access live game systems, leaderboard and wallet features.</p>
      </div>
    </main>
  );
}
