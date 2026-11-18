import React, { useState } from 'react';
import { Check, ChevronLeft, Crown } from 'lucide-react';
import { InfoSheetDialog } from '../components/ConfirmDialog';
import { NavigationShell } from '../components/NavigationShell';
import { useNotes } from '../context/NotesContext';

const FEATURES = [
  'Unlimited notes',
  'Unlimited folders',
  'Advanced note formatting',
  'Premium themes',
  'Cloud backup',
  'Secure note experience',
];

export function PremiumScreen() {
  const { goBack } = useNotes();
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [prototypeModalOpen, setPrototypeModalOpen] = useState(false);

  return (
    <NavigationShell showMobileTabs={false}>
      <header className="sticky top-0 z-20 bg-[#F8F7F5]/95 dark:bg-[#171717]/95 backdrop-blur-md px-4 sm:px-8 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#202124] dark:text-[#F4F4F2] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202124] dark:text-[#F4F4F2]">
            Notes Premium
          </h1>
        </div>
      </header>

      <section className="px-5 sm:px-8 pt-4 pb-12 max-w-xl mx-auto space-y-6">
        <div className="rounded-3xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] p-6 sm:p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF5D9] dark:bg-[#D9A928]/20 text-[#D9A928]">
            <Crown className="h-7 w-7" strokeWidth={1.85} />
          </div>

          <h2 className="mt-4 text-xl sm:text-2xl font-bold text-[#202124] dark:text-[#F4F4F2] text-balance">
            Write without limits
          </h2>
          <p className="mt-1.5 text-sm text-[#858585] dark:text-[#9A9A96]">
            Unlock deeper organization, rich formatting, and seamless backup across devices.
          </p>

          <ul className="mt-6 space-y-3 text-left">
            {FEATURES.map((feat) => (
              <li key={feat} className="flex items-center gap-3 text-sm text-[#202124] dark:text-[#F4F4F2]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF5D9] dark:bg-[#D9A928]/20 text-[#D9A928]">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Plan Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPlan('monthly')}
            className={`rounded-2xl p-4 text-left border transition-colors cursor-pointer ${
              plan === 'monthly'
                ? 'bg-[#FFF5D9] dark:bg-[#D9A928]/16 border-[#D9A928]'
                : 'bg-white dark:bg-[#222222] border-[#EEEEEC] dark:border-[#2E2E2B]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#202124] dark:text-[#F4F4F2]">
                Monthly
              </span>
              <span
                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                  plan === 'monthly'
                    ? 'border-[#D9A928] bg-[#D9A928]'
                    : 'border-[#858585]/40'
                }`}
              >
                {plan === 'monthly' && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </span>
            </div>
            <p className="mt-2 text-xl font-bold text-[#202124] dark:text-[#F4F4F2] tabular-nums">
              $4.99
              <span className="text-xs font-normal text-[#858585]"> / month</span>
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPlan('yearly')}
            className={`rounded-2xl p-4 text-left border transition-colors cursor-pointer ${
              plan === 'yearly'
                ? 'bg-[#FFF5D9] dark:bg-[#D9A928]/16 border-[#D9A928]'
                : 'bg-white dark:bg-[#222222] border-[#EEEEEC] dark:border-[#2E2E2B]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#202124] dark:text-[#F4F4F2]">
                Yearly
              </span>
              <span
                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                  plan === 'yearly'
                    ? 'border-[#D9A928] bg-[#D9A928]'
                    : 'border-[#858585]/40'
                }`}
              >
                {plan === 'yearly' && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </span>
            </div>
            <p className="mt-2 text-xl font-bold text-[#202124] dark:text-[#F4F4F2] tabular-nums">
              $39.99
              <span className="text-xs font-normal text-[#858585]"> / year · Save 33%</span>
            </p>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPrototypeModalOpen(true)}
          className="w-full min-h-[50px] rounded-full bg-[#202124] dark:bg-[#D9A928] text-sm font-semibold text-white dark:text-[#171717] transition-opacity hover:opacity-90 cursor-pointer"
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
          <p className="text-sm text-[#202124] dark:text-[#F4F4F2]">
            Selected plan: <span className="font-semibold capitalize">{plan}</span>
          </p>
          <p className="text-sm text-[#858585] dark:text-[#9A9A96]">
            Payments are not processed in this UI prototype. Connect a billing provider when you
            are ready to enable live subscriptions.
          </p>
        </div>
      </InfoSheetDialog>
    </NavigationShell>
  );
}
