import React from 'react';
import { Check, ChevronLeft, Monitor, Moon, Sun } from 'lucide-react';
import { NavigationShell } from '../components/NavigationShell';
import { useNotes } from '../context/NotesContext';
import { ThemePreference } from '../types/notes';

export function AppearanceScreen() {
  const { theme, setTheme, goBack } = useNotes();

  const options: {
    id: ThemePreference;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }[] = [
    {
      id: 'light',
      label: 'Light Mode',
      description: 'Warm paper background with crisp dark typography',
      icon: Sun,
    },
    {
      id: 'dark',
      label: 'Dark Mode',
      description: 'Low-glare charcoal canvas for comfortable evening writing',
      icon: Moon,
    },
    {
      id: 'system',
      label: 'System Default',
      description: 'Automatically match your device appearance setting',
      icon: Monitor,
    },
  ];

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
            Appearance
          </h1>
        </div>
      </header>

      <section className="px-5 sm:px-8 pt-3 space-y-6">
        <div className="rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] divide-y divide-[#EEEEEC] dark:divide-[#2E2E2B]">
          {options.map((opt) => {
            const Icon = opt.icon;
            const selected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
                className="flex w-full min-h-[68px] items-center justify-between gap-4 px-4 py-3 text-left hover:bg-[#F8F7F5]/60 dark:hover:bg-[#2B2B29]/50 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-3.5">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      selected
                        ? 'bg-[#FFF5D9] dark:bg-[#D9A928]/20 text-[#D9A928]'
                        : 'bg-[#F8F7F5] dark:bg-[#171717] text-[#858585]'
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.85} />
                  </span>
                  <span>
                    <span className="block text-[15px] font-medium text-[#202124] dark:text-[#F4F4F2]">
                      {opt.label}
                    </span>
                    <span className="block text-xs text-[#858585] dark:text-[#9A9A96] mt-0.5">
                      {opt.description}
                    </span>
                  </span>
                </span>

                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    selected
                      ? 'border-[#D9A928] bg-[#D9A928] text-white dark:text-[#171717]'
                      : 'border-[#858585]/40'
                  }`}
                >
                  {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Theme Preview Card */}
        <div className="rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] p-5">
          <p className="text-xs font-medium text-[#858585] dark:text-[#9A9A96]">
            Preview
          </p>
          <h2 className="mt-2 text-base font-semibold text-[#202124] dark:text-[#F4F4F2]">
            Morning reading notes
          </h2>
          <p className="mt-1 text-sm text-[#858585] dark:text-[#9A9A96]">
            Warm surfaces and high-contrast typography adapt seamlessly across every screen.
          </p>
        </div>
      </section>
    </NavigationShell>
  );
}
