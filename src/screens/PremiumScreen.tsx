import React, { useState } from 'react';
import { Check, ChevronLeft, Crown } from 'lucide-react';
import { InfoSheetDialog } from '../components/ConfirmDialog';
import { NavigationShell } from '../components/NavigationShell';
import { useNotes } from '../context/NotesContext';
import { FREE_LIMITS } from '../types/notes';

const PLAN_COMPARISON = [
  {
    feature: 'Notes',
    free: `Up to ${FREE_LIMITS.maxActiveNotes} active notes`,
    premium: 'Unlimited notes',
  },
  {
    feature: 'Folders',
    free: `Up to ${FREE_LIMITS.maxFolders} folders`,
    premium: 'Unlimited folders',
  },
  {
    feature: 'Formatting & Media',
    free: `Basic text + ${FREE_LIMITS.maxImagesPerNote} image/note`,
    premium: 'Checklists, H2, Quotes & Unlimited images',
  },
  {
    feature: 'Themes',
    free: 'Light, Dark & System',
    premium: 'Sepia, Sage & Slate palettes',
  },
  {
    feature: 'Cloud Backup',
    free: 'Local JSON export',
    premium: 'Auto Cloud Backup (sync ready)',
  },
  {
    feature: 'Security',
    free: 'Standard access',
    premium: '4-digit PIN Note Lock',
  },
];

export function PremiumScreen() {
  const { isPremium, setIsPremium, activeNotes, folders, goBack } = useNotes();
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [prototypeModalOpen, setPrototypeModalOpen] = useState(false);

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
            Notes Premium
          </h1>
        </div>
      </header>

      <section className="px-5 sm:px-8 pt-4 pb-12 max-w-xl mx-auto space-y-6">
        {/* Prototype Preview Mode Switch */}
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Preview Plan Mode
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums">
              {isPremium
                ? 'Testing unlocked Premium features'
                : `Free limits active (${activeNotes.length}/${FREE_LIMITS.maxActiveNotes} notes · ${folders.length}/${FREE_LIMITS.maxFolders} folders)`}
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-[var(--bg-canvas)] p-1 border border-[var(--divider)] shrink-0">
            <button
              type="button"
              onClick={() => setIsPremium(false)}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                !isPremium
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--divider)]'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Free
            </button>
            <button
              type="button"
              onClick={() => setIsPremium(true)}
              className={`min-h-[34px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isPremium
                  ? 'bg-[var(--accent-primary)] text-[#171717]'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Premium
            </button>
          </div>
        </div>

        {/* Hero Feature Card */}
        <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--divider)] p-6 sm:p-7 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
            <Crown className="h-7 w-7" strokeWidth={1.85} />
          </div>

          <h2 className="mt-4 text-xl sm:text-2xl font-bold text-[var(--text-primary)] text-balance">
            Write without limits
          </h2>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            Unlock deeper organization, rich formatting, curated themes, and PIN-protected notes.
          </p>

          <div className="mt-6 divide-y divide-[var(--divider)] text-left">
            {PLAN_COMPARISON.map((row) => (
              <div key={row.feature} className="py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{row.feature}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Free: {row.free}</p>
                </div>
                <div className="flex items-center gap-1.5 text-right shrink-0 max-w-[52%]">
                  <Check className="h-3.5 w-3.5 text-[var(--accent-primary)] shrink-0" strokeWidth={2.5} />
                  <span className="text-xs font-semibold text-[var(--text-primary)]">
                    {row.premium}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPlan('monthly')}
            className={`rounded-2xl p-4 text-left border transition-colors cursor-pointer ${
              plan === 'monthly'
                ? 'bg-[var(--accent-soft)] border-[var(--accent-primary)]'
                : 'bg-[var(--bg-card)] border-[var(--divider)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Monthly</span>
              <span
                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                  plan === 'monthly'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]'
                    : 'border-[var(--text-secondary)]/40'
                }`}
              >
                {plan === 'monthly' && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </span>
            </div>
            <p className="mt-2 text-xl font-bold text-[var(--text-primary)] tabular-nums">
              $4.99
              <span className="text-xs font-normal text-[var(--text-secondary)]"> / month</span>
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPlan('yearly')}
            className={`rounded-2xl p-4 text-left border transition-colors cursor-pointer ${
              plan === 'yearly'
                ? 'bg-[var(--accent-soft)] border-[var(--accent-primary)]'
                : 'bg-[var(--bg-card)] border-[var(--divider)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--text-primary)]">Yearly</span>
              <span
                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                  plan === 'yearly'
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]'
                    : 'border-[var(--text-secondary)]/40'
                }`}
              >
                {plan === 'yearly' && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </span>
            </div>
            <p className="mt-2 text-xl font-bold text-[var(--text-primary)] tabular-nums">
              $39.99
              <span className="text-xs font-normal text-[var(--text-secondary)]">
                {' '}
                / year · Save 33%
              </span>
            </p>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPrototypeModalOpen(true)}
          className="w-full min-h-[50px] rounded-full bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] transition-opacity hover:opacity-90 cursor-pointer"
        >
          Continue
        </button>
      </section>

      <InfoSheetDialog
        open={prototypeModalOpen}
        title="Subscription Preview"
        onClose={() => setPrototypeModalOpen(false)}
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-primary)]">
            Selected plan: <span className="font-semibold capitalize">{plan}</span>
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Live billing is not active until a payment provider is connected. Use the Preview Plan
            Mode switch above to test both Free and Premium experiences right now.
          </p>
        </div>
      </InfoSheetDialog>
    </NavigationShell>
  );
}
