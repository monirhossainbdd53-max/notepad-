import React, { useState } from 'react';
import { ChevronDown, ChevronLeft, Send } from 'lucide-react';
import { NavigationShell } from '../components/NavigationShell';
import { useNotes } from '../context/NotesContext';

const FAQS = [
  {
    q: 'How does auto-save work while writing?',
    a: 'Every edit to your note title or content is saved automatically to your device within a fraction of a second.',
  },
  {
    q: 'How do I organize notes into folders?',
    a: 'Open the Folders tab to create or rename folders, or open any note and tap Move to Folder from the options menu.',
  },
  {
    q: 'What is the difference between Archive and Trash?',
    a: 'Archived notes stay saved out of your main feed indefinitely. Trashed notes remain recoverable until you permanently delete them or empty Trash.',
  },
  {
    q: 'Can I switch between Light and Dark mode?',
    a: 'Yes. Go to Settings → Appearance to choose Light Mode, Dark Mode, or System Default.',
  },
];

export function HelpSupportScreen() {
  const { goBack, showToast } = useNotes();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubject('');
    setMessage('');
    showToast('Support message saved (UI preview)');
  };

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
            Help & Support
          </h1>
        </div>
      </header>

      <section className="px-5 sm:px-8 pt-3 pb-12 space-y-6">
        <div>
          <h2 className="px-1 mb-2.5 text-xs font-semibold text-[#858585] dark:text-[#9A9A96]">
            Frequently Asked Questions
          </h2>
          <div className="rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] divide-y divide-[#EEEEEC] dark:divide-[#2E2E2B]">
            {FAQS.map((item, idx) => {
              const expanded = openIndex === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(expanded ? null : idx)}
                    aria-expanded={expanded}
                    className="flex w-full min-h-[54px] items-center justify-between gap-3 px-4 py-3 text-left cursor-pointer"
                  >
                    <span className="text-sm font-medium text-[#202124] dark:text-[#F4F4F2]">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#858585] transition-transform ${
                        expanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expanded && (
                    <p className="px-4 pb-4 text-sm text-[#858585] dark:text-[#9A9A96] leading-relaxed">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="px-1 mb-2.5 text-xs font-semibold text-[#858585] dark:text-[#9A9A96]">
            Send Feedback
          </h2>
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] p-4 space-y-3"
          >
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              aria-label="Subject"
              className="w-full min-h-[46px] rounded-xl bg-[#F8F7F5] dark:bg-[#171717] border border-[#EEEEEC] dark:border-[#2E2E2B] px-4 text-sm text-[#202124] dark:text-[#F4F4F2] placeholder:text-[#858585] focus:outline-none focus:border-[#D9A928]"
            />

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your question or feedback..."
              aria-label="Message"
              rows={4}
              className="w-full rounded-xl bg-[#F8F7F5] dark:bg-[#171717] border border-[#EEEEEC] dark:border-[#2E2E2B] p-4 text-sm text-[#202124] dark:text-[#F4F4F2] placeholder:text-[#858585] focus:outline-none focus:border-[#D9A928] resize-none"
            />

            <button
              type="submit"
              disabled={!subject.trim() || !message.trim()}
              className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#202124] dark:bg-[#D9A928] text-sm font-semibold text-white dark:text-[#171717] disabled:opacity-40 cursor-pointer"
            >
              <Send className="h-4 w-4" strokeWidth={2} />
              Send Message
            </button>
          </form>
        </div>
      </section>
    </NavigationShell>
  );
}
