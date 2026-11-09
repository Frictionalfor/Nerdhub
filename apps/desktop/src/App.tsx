import { useTheme } from './lib/theme';

/**
 * Root application.
 *
 * M0 establishes the shell (theme + online state + app chrome) without
 * implementing product routes. Unavailable modules are not rendered as dead
 * buttons; the shell intentionally renders a placeholder until those
 * milestones ship.
 */
export function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-violet-600 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
              nerdhub
            </span>
            <span className="text-text-secondary font-mono text-xs">m0 · foundation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:block text-text-muted text-sm">Theme: {theme}</span>
            <button
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              className="inline-flex items-center justify-center rounded-md border border-border bg-surface text-text-primary px-3 py-1.5 text-sm hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold text-text-primary">NerdHub</h1>
          <p className="mt-2 text-text-secondary">A place where curiosity has no boundaries.</p>

          <div className="mt-6 rounded-lg border border-border bg-surface p-6">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              Milestone M0
            </h2>
            <p className="mt-2 text-text-primary">
              Engineering foundation in place: monorepo, NestJS API, worker, PostgreSQL, Redis,
              shared contracts, CI, and this desktop shell.
            </p>
            <p className="mt-3 text-sm text-text-secondary">
              Product features (auth, topics, posts, publishing, …) are intentionally not part of M0
              and will arrive in later milestones.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
