import React, { useState } from 'react';
import { Check, Folder, Plus } from 'lucide-react';
import { useNotes } from '../context/NotesContext';

const SLIDES = [
  {
    id: 'capture',
    title: 'Write and Capture Clearly',
    description:
      'Keep your ideas, meeting notes, and writing drafts in one calm, distraction-free space.',
    icon: 'write',
  },
  {
    id: 'organize',
    title: 'Stay Organized Effortlessly',
    description:
      'Group notes with folders, pin essentials to the top, and find anything in seconds.',
    icon: 'organize',
  },
];

export function OnboardingScreen() {
  const { completeOnboarding } = useNotes();
  const [step, setStep] = useState(0);

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F5] dark:bg-[#171717] text-[#202124] dark:text-[#F4F4F2] flex flex-col justify-between px-6 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-md justify-end">
        <button
          type="button"
          onClick={completeOnboarding}
          className="min-h-[44px] px-3 text-sm font-medium text-[#858585] dark:text-[#9A9A96] hover:text-[#202124] dark:hover:text-[#F4F4F2] transition-colors cursor-pointer"
        >
          Skip
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col items-center text-center my-auto py-8">
        {/* Clean circular minimal illustration */}
        <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B]">
          {slide.icon === 'write' ? (
            <div className="relative flex h-24 w-20 flex-col justify-center gap-2.5 rounded-2xl border-2 border-[#202124] dark:border-[#F4F4F2] bg-[#F8F7F5] dark:bg-[#171717] px-3.5">
              <div className="h-0.5 w-full rounded bg-[#202124] dark:bg-[#F4F4F2]" />
              <div className="h-0.5 w-4/5 rounded bg-[#202124] dark:bg-[#F4F4F2]" />
              <div className="h-0.5 w-3/5 rounded bg-[#858585]" />
              <div className="absolute -bottom-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#202124] dark:bg-[#D9A928] text-white dark:text-[#171717]">
                <Plus className="h-4 w-4" strokeWidth={2.5} />
              </div>
            </div>
          ) : (
            <div className="relative flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-[#202124] dark:border-[#F4F4F2] bg-[#F8F7F5] dark:bg-[#171717]">
              <Folder className="h-9 w-9 text-[#202124] dark:text-[#F4F4F2]" strokeWidth={1.75} />
              <div className="absolute -bottom-2.5 -right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#D9A928] text-white dark:text-[#171717]">
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </div>
            </div>
          )}
        </div>

        <h1 className="mt-10 text-2xl sm:text-3xl font-bold tracking-tight text-[#202124] dark:text-[#F4F4F2] text-balance">
          {slide.title}
        </h1>
        <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-[#858585] dark:text-[#9A9A96]">
          {slide.description}
        </p>

        {/* Minimal indicator dots */}
        <div className="mt-8 flex items-center gap-2" aria-label="Onboarding progress">
          {SLIDES.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === step
                  ? 'w-5 bg-[#202124] dark:bg-[#D9A928]'
                  : 'w-2 bg-[#EEEEEC] dark:bg-[#2E2E2B]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-xs">
        <button
          type="button"
          onClick={handleNext}
          className="w-full min-h-[48px] rounded-full bg-[#202124] dark:bg-[#D9A928] px-6 text-sm font-semibold text-white dark:text-[#171717] transition-opacity hover:opacity-90 active:opacity-80 cursor-pointer"
        >
          {isLast ? 'Start Writing' : 'Next'}
        </button>
      </div>
    </div>
  );
}
