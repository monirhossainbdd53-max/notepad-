import React from 'react';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { NavigationShell } from '../components/NavigationShell';
import { useNotes } from '../context/NotesContext';

export function AboutAppScreen() {
  const { navigate, goBack } = useNotes();

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
            About App
          </h1>
        </div>
      </header>

      <section className="px-5 sm:px-8 pt-6 space-y-6">
        <div className="rounded-3xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] p-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF5D9] dark:bg-[#D9A928]/20 text-[#202124] dark:text-[#D9A928]">
            <FileText className="h-8 w-8" strokeWidth={1.75} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[#202124] dark:text-[#F4F4F2]">Notes</h2>
          <p className="mt-1 text-sm text-[#858585] dark:text-[#9A9A96]">
            Capture your thoughts
          </p>
          <p className="mt-3 text-xs text-[#858585] dark:text-[#9A9A96] tabular-nums">
            Version 1.0.0
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] divide-y divide-[#EEEEEC] dark:divide-[#2E2E2B]">
          <button
            type="button"
            onClick={() => navigate('splash')}
            className="flex w-full min-h-[54px] items-center justify-between px-4 text-left text-sm font-medium hover:bg-[#F8F7F5]/60 dark:hover:bg-[#2B2B29]/50 transition-colors cursor-pointer"
          >
            <span>View Welcome Screen</span>
            <ChevronRight className="h-4 w-4 text-[#858585]" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={() => navigate('onboarding')}
            className="flex w-full min-h-[54px] items-center justify-between px-4 text-left text-sm font-medium hover:bg-[#F8F7F5]/60 dark:hover:bg-[#2B2B29]/50 transition-colors cursor-pointer"
          >
            <span>Replay Onboarding</span>
            <ChevronRight className="h-4 w-4 text-[#858585]" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={() => navigate('premium')}
            className="flex w-full min-h-[54px] items-center justify-between px-4 text-left text-sm font-medium hover:bg-[#F8F7F5]/60 dark:hover:bg-[#2B2B29]/50 transition-colors cursor-pointer"
          >
            <span>Explore Notes Premium</span>
            <ChevronRight className="h-4 w-4 text-[#858585]" strokeWidth={1.75} />
          </button>
        </div>
      </section>
    </NavigationShell>
  );
}
