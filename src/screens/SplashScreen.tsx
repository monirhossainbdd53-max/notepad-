import React from 'react';
import { FileText } from 'lucide-react';
import { useNotes } from '../context/NotesContext';

export function SplashScreen() {
  const { navigate, completeOnboarding } = useNotes();

  return (
    <div className="min-h-screen bg-[#F8F7F5] dark:bg-[#171717] text-[#202124] dark:text-[#F4F4F2] flex flex-col items-center justify-between px-6 py-12">
      <div />

      <div className="flex flex-col items-center text-center max-w-sm">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B]">
          <FileText className="h-9 w-9 text-[#202124] dark:text-[#D9A928]" strokeWidth={1.75} />
        </div>

        <h1 className="mt-7 text-3xl sm:text-4xl font-bold tracking-tight text-[#202124] dark:text-[#F4F4F2]">
          Notes
        </h1>
        <p className="mt-2.5 text-[15px] text-[#858585] dark:text-[#9A9A96]">
          Capture your thoughts
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <button
          type="button"
          onClick={() => navigate('onboarding')}
          className="w-full min-h-[48px] rounded-full bg-[#202124] dark:bg-[#D9A928] px-6 text-sm font-semibold text-white dark:text-[#171717] transition-opacity hover:opacity-90 active:opacity-80 cursor-pointer"
        >
          Get Started
        </button>

        <button
          type="button"
          onClick={completeOnboarding}
          className="w-full min-h-[44px] rounded-full px-6 text-sm font-medium text-[#858585] dark:text-[#9A9A96] hover:text-[#202124] dark:hover:text-[#F4F4F2] transition-colors cursor-pointer"
        >
          Skip to Notes
        </button>
      </div>
    </div>
  );
}
