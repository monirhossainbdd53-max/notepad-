import React, { useState } from 'react';
import {
  Check,
  ChevronLeft,
  Cloud,
  Crown,
  FileText,
  FolderOpen,
  Lock,
  Palette,
  Sparkles,
} from 'lucide-react';
import { InfoSheetDialog } from '../components/ConfirmDialog';
import { NavigationShell } from '../components/NavigationShell';
import { useNotes } from '../context/NotesContext';
import { FREE_LIMITS } from '../types/notes';

const PREMIUM_FEATURES = [
  {
    icon: FileText,
    title: 'Unlimited notes',
    detail: `No ${FREE_LIMITS.maxActiveNotes}-note cap from the Free plan`,
  },
  {
    icon: FolderOpen,
    title: 'Unlimited folders',
    detail: `Organize beyond ${FREE_LIMITS.maxFolders} folders`,
  },
  {
    icon: Sparkles,
    title: 'Rich formatting & unlimited photos',
    detail: `Headings, quotes, checklists & more than ${FREE_LIMITS.maxImagesPerNote} photo per note`,
  },
  {
    icon: Palette,
    title: 'Premium themes',
    detail: 'Sepia, Sage, and Slate color palettes',
  },
  {
    icon: Lock,
    title: '4-digit PIN note lock',
    detail: 'Hide previews and lock private notes',
  },
  {
    icon: Cloud,
    title: 'Auto cloud backup',
    detail: 'Sync-ready backup alongside JSON export',
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

      <section className="px-5 sm:px-8 pt-4 pb-14 max-w-lg mx-auto space-y-7">
        {/* Clean Hero */}
        <div className="text-center pt-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
            <Crown className="h-7 w-7" strokeWidth={1.85} />
          </div>

          <h2 className="mt-4 text-2xl sm:text-[28px] font-bold tracking-tight text-[var(--text-primary)]">
            Write without limits
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
            Everything you need to write, organize, and keep your notes private.
          </p>
        </div>

        {/* Scannable Feature List */}
        <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--divider)] divide-y divide-[var(--divider)]">
          {PREMIUM_FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-center gap-3.5 px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">
                    {item.detail}
                  </p>
                </div>
                <Check className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" strokeWidth={2.4} />
              </div>
            );
          })}
        </div>

        {/* Pricing Cards */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
                <span className="text-xs font-semibold text-[var(--accent-primary)]">
                  Save 33%
                </span>
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
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Yearly</p>
              <p className="mt-0.5 text-xl font-bold text-[var(--text-primary)] tabular-nums">
                $39.99
                <span className="text-xs font-normal text-[var(--text-secondary)]"> / yr</span>
              </p>
            </button>

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
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Flexible
                </span>
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
              <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">Monthly</p>
              <p className="mt-0.5 text-xl font-bold text-[var(--text-primary)] tabular-nums">
                $4.99
                <span className="text-xs font-normal text-[var(--text-secondary)]"> / mo</span>
              </p>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPrototypeModalOpen(true)}
            className="w-full min-h-[50px] rounded-full bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] transition-opacity hover:opacity-90 cursor-pointer"
          >
            {isPremium
              ? 'Premium Preview Active'
              : `Continue with ${plan === 'yearly' ? 'Yearly ($39.99/yr)' : 'Monthly ($4.99/mo)'}`}
          </button>
        </div>

        {/* Subtle Plan Mode Switcher */}
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--text-primary)]">
              Preview Mode
            </p>
            <p className="text-xs text-[var(--text-secondary)] tabular-nums truncate">
              {isPremium
                ? 'All Premium features unlocked'
                : `${activeNotes.length}/${FREE_LIMITS.maxActiveNotes} notes · ${folders.length}/${FREE_LIMITS.maxFolders} folders used`}
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl bg-[var(--bg-canvas)] p-1 border border-[var(--divider)] shrink-0">
            <button
              type="button"
              onClick={() => setIsPremium(false)}
              className={`min-h-[32px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
              className={`min-h-[32px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                isPremium
                  ? 'bg-[var(--accent-primary)] text-[#171717]'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Premium
            </button>
          </div>
        </div>
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
            Live billing will be enabled once a payment provider is connected. Switch Preview Mode
            to Premium at the bottom of the page to test all features immediately.
          </p>
        </div>
      </InfoSheetDialog>
    </NavigationShell>
  );
}
