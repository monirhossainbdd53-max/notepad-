import React from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { NavigationShell } from '../components/NavigationShell';
import { useNotes } from '../context/NotesContext';

export function AboutAppScreen() {
  const { navigate, goBack } = useNotes();

  return (
    <NavigationShell showMobileTabs={false}>
      <header className="sticky top-0 z-20 bg-[var(--bg-canvas)]/95 backdrop-blur-md px-4 sm:px-8 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            About App
          </h1>
        </div>
      </header>

      <section className="px-5 sm:px-8 pt-6 space-y-6">
        <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--divider)] p-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
            <FileText className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">Notes</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Capture your thoughts</p>
          <p className="mt-3 text-xs text-[var(--text-secondary)] tabular-nums">Version 1.0.0</p>
        </div>

        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] divide-y divide-[var(--divider)]">
          <button
            type="button"
            onClick={() => navigate('splash')}
            className="flex w-full min-h-[54px] items-center justify-between px-4 text-left text-sm font-medium hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
          >
            <span>View Welcome Screen</span>
            <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={() => navigate('onboarding')}
            className="flex w-full min-h-[54px] items-center justify-between px-4 text-left text-sm font-medium hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
          >
            <span>Replay Onboarding</span>
            <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={() => navigate('premium')}
            className="flex w-full min-h-[54px] items-center justify-between px-4 text-left text-sm font-medium hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
          >
            <span>Explore Notes Premium</span>
            <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
          </button>
        </div>
      </section>
    </NavigationShell>
  );
}
