import React, { useState } from 'react';
import { ChevronLeft, RotateCcw, User } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NavigationShell } from '../components/NavigationShell';
import { useNotes } from '../context/NotesContext';

export function AccountScreen() {
  const { account, updateAccount, activeNotes, folders, isPremium, resetLocalData, goBack } =
    useNotes();

  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [resetOpen, setResetOpen] = useState(false);

  const initials = (name || account.name)
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAccount({
      name: name.trim() || 'Notes User',
      email: email.trim() || 'user@example.com',
    });
  };

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
            Account
          </h1>
        </div>
      </header>

      <section className="px-5 sm:px-8 pt-4 space-y-6">
        <div className="flex items-center gap-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] p-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-lg font-bold text-[var(--accent-primary)]">
            {initials || <User className="h-6 w-6" />}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold truncate">{account.name}</p>
            <p className="text-sm text-[var(--text-secondary)] truncate">{account.email}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)] tabular-nums">
              {isPremium ? 'Premium' : 'Free'} · {activeNotes.length} notes · {folders.length}{' '}
              folders
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] p-5 space-y-3.5"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            aria-label="Full name"
            className="w-full min-h-[46px] rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
          />

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            aria-label="Email address"
            className="w-full min-h-[46px] rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
          />

          <button
            type="submit"
            className="w-full min-h-[46px] rounded-xl bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] transition-opacity hover:opacity-90 cursor-pointer"
          >
            Save Profile
          </button>
        </form>

        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="flex w-full min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] text-sm font-medium text-[#E45B5B] hover:bg-[#E45B5B]/5 transition-colors cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={1.85} />
          Reset Local Workspace
        </button>
      </section>

      <ConfirmDialog
        open={resetOpen}
        title="Reset Workspace?"
        description="This will clear all locally stored notes and folders on this device."
        confirmLabel="Reset Data"
        onConfirm={resetLocalData}
        onClose={() => setResetOpen(false)}
      />
    </NavigationShell>
  );
}
