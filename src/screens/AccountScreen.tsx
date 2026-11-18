import React, { useState } from 'react';
import { ChevronLeft, RotateCcw, User } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NavigationShell } from '../components/NavigationShell';
import { useNotes } from '../context/NotesContext';

export function AccountScreen() {
  const { account, updateAccount, activeNotes, folders, resetLocalData, goBack } = useNotes();

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
            Account
          </h1>
        </div>
      </header>

      <section className="px-5 sm:px-8 pt-4 space-y-6">
        <div className="flex items-center gap-4 rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] p-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#FFF5D9] dark:bg-[#D9A928]/20 text-lg font-bold text-[#202124] dark:text-[#D9A928]">
            {initials || <User className="h-6 w-6" />}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold truncate">{account.name}</p>
            <p className="text-sm text-[#858585] dark:text-[#9A9A96] truncate">{account.email}</p>
            <p className="mt-1 text-xs text-[#858585] dark:text-[#9A9A96] tabular-nums">
              {activeNotes.length} notes · {folders.length} folders
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] p-5 space-y-3.5"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            aria-label="Full name"
            className="w-full min-h-[46px] rounded-xl bg-[#F8F7F5] dark:bg-[#171717] border border-[#EEEEEC] dark:border-[#2E2E2B] px-4 text-sm text-[#202124] dark:text-[#F4F4F2] placeholder:text-[#858585] focus:outline-none focus:border-[#D9A928]"
          />

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            aria-label="Email address"
            className="w-full min-h-[46px] rounded-xl bg-[#F8F7F5] dark:bg-[#171717] border border-[#EEEEEC] dark:border-[#2E2E2B] px-4 text-sm text-[#202124] dark:text-[#F4F4F2] placeholder:text-[#858585] focus:outline-none focus:border-[#D9A928]"
          />

          <button
            type="submit"
            className="w-full min-h-[46px] rounded-xl bg-[#202124] dark:bg-[#D9A928] text-sm font-semibold text-white dark:text-[#171717] transition-opacity hover:opacity-90 cursor-pointer"
          >
            Save Profile
          </button>
        </form>

        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="flex w-full min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] text-sm font-medium text-[#E45B5B] hover:bg-[#E45B5B]/5 transition-colors cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={1.85} />
          Reset Local Workspace
        </button>
      </section>

      <ConfirmDialog
        open={resetOpen}
        title="Reset Workspace?"
        description="This will restore the default sample notes and folders on this device."
        confirmLabel="Reset Data"
        onConfirm={resetLocalData}
        onClose={() => setResetOpen(false)}
      />
    </NavigationShell>
  );
}
