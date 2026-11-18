import React, { useState } from 'react';
import {
  Bell,
  ChevronRight,
  Cloud,
  Crown,
  Download,
  FileText,
  Folder,
  HelpCircle,
  Info,
  Moon,
  RotateCcw,
  Shield,
  User,
} from 'lucide-react';
import { FolderPickerDialog, InfoSheetDialog } from '../components/ConfirmDialog';
import { NavigationShell } from '../components/NavigationShell';
import { useNotes } from '../context/NotesContext';

export function SettingsScreen() {
  const {
    account,
    theme,
    defaultFolderId,
    setDefaultFolderId,
    getFolderById,
    folders,
    notes,
    notifications,
    updateNotifications,
    navigate,
    showToast,
  } = useNotes();

  const [defaultFolderOpen, setDefaultFolderOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);

  const defaultFolder = getFolderById(defaultFolderId) || folders[0];
  const themeLabel =
    theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light';

  const initials = account.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleExportBackup = () => {
    try {
      const payload = JSON.stringify({ notes, folders, exportedAt: new Date().toISOString() }, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Local backup exported');
    } catch {
      showToast('Export unavailable');
    }
  };

  return (
    <NavigationShell showMobileTabs>
      <header className="sticky top-0 z-20 bg-[#F8F7F5]/95 dark:bg-[#171717]/95 backdrop-blur-md px-5 sm:px-8 pt-5 pb-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202124] dark:text-[#F4F4F2]">
          Settings
        </h1>
      </header>

      <section className="px-5 sm:px-8 pt-2 space-y-6">
        {/* Account Card */}
        <div>
          <h2 className="px-1 mb-2 text-xs font-semibold text-[#858585] dark:text-[#9A9A96]">
            Account
          </h2>
          <button
            type="button"
            onClick={() => navigate('account')}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] p-4 text-left hover:border-[#D9A928]/60 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-3.5 min-w-0">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFF5D9] dark:bg-[#D9A928]/20 text-sm font-bold text-[#202124] dark:text-[#D9A928]">
                {initials || <User className="h-5 w-5" />}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-[#202124] dark:text-[#F4F4F2] truncate">
                  {account.name || 'Local Profile'}
                </span>
                <span className="block text-xs text-[#858585] dark:text-[#9A9A96] truncate">
                  {account.email || 'Tap to manage account'}
                </span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#858585]" strokeWidth={1.75} />
          </button>
        </div>

        {/* Preferences */}
        <div>
          <h2 className="px-1 mb-2 text-xs font-semibold text-[#858585] dark:text-[#9A9A96]">
            Preferences
          </h2>
          <div className="rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] divide-y divide-[#EEEEEC] dark:divide-[#2E2E2B]">
            <button
              type="button"
              onClick={() => navigate('appearance')}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[#F8F7F5]/60 dark:hover:bg-[#2B2B29]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Moon className="h-4 w-4 text-[#858585]" strokeWidth={1.85} />
                Appearance
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#858585]">
                <span>{themeLabel}</span>
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDefaultFolderOpen(true)}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[#F8F7F5]/60 dark:hover:bg-[#2B2B29]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Folder className="h-4 w-4 text-[#858585]" strokeWidth={1.85} />
                Default Folder
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#858585]">
                <span>{defaultFolder?.name || 'Personal'}</span>
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[#F8F7F5]/60 dark:hover:bg-[#2B2B29]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Bell className="h-4 w-4 text-[#858585]" strokeWidth={1.85} />
                Notification Preferences
              </span>
              <ChevronRight className="h-4 w-4 text-[#858585]" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Storage */}
        <div>
          <h2 className="px-1 mb-2 text-xs font-semibold text-[#858585] dark:text-[#9A9A96]">
            Storage
          </h2>
          <div className="rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B]">
            <button
              type="button"
              onClick={() => setBackupOpen(true)}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[#F8F7F5]/60 dark:hover:bg-[#2B2B29]/50 transition-colors cursor-pointer rounded-2xl"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Cloud className="h-4 w-4 text-[#858585]" strokeWidth={1.85} />
                Backup & Sync
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#858585]">
                <span>Local</span>
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </button>
          </div>
        </div>

        {/* Premium */}
        <div>
          <h2 className="px-1 mb-2 text-xs font-semibold text-[#858585] dark:text-[#9A9A96]">
            Premium
          </h2>
          <div className="rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] divide-y divide-[#EEEEEC] dark:divide-[#2E2E2B]">
            <button
              type="button"
              onClick={() => navigate('premium')}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[#F8F7F5]/60 dark:hover:bg-[#2B2B29]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Crown className="h-4 w-4 text-[#D9A928]" strokeWidth={1.9} />
                Subscription
              </span>
              <ChevronRight className="h-4 w-4 text-[#858585]" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => setRestoreOpen(true)}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[#F8F7F5]/60 dark:hover:bg-[#2B2B29]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <RotateCcw className="h-4 w-4 text-[#858585]" strokeWidth={1.85} />
                Restore Purchase
              </span>
              <ChevronRight className="h-4 w-4 text-[#858585]" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Support */}
        <div>
          <h2 className="px-1 mb-2 text-xs font-semibold text-[#858585] dark:text-[#9A9A96]">
            Support
          </h2>
          <div className="rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] divide-y divide-[#EEEEEC] dark:divide-[#2E2E2B]">
            <button
              type="button"
              onClick={() => navigate('help')}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[#F8F7F5]/60 dark:hover:bg-[#2B2B29]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <HelpCircle className="h-4 w-4 text-[#858585]" strokeWidth={1.85} />
                Help & Support
              </span>
              <ChevronRight className="h-4 w-4 text-[#858585]" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => setLegalDoc('privacy')}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[#F8F7F5]/60 dark:hover:bg-[#2B2B29]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Shield className="h-4 w-4 text-[#858585]" strokeWidth={1.85} />
                Privacy Policy
              </span>
              <ChevronRight className="h-4 w-4 text-[#858585]" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => setLegalDoc('terms')}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[#F8F7F5]/60 dark:hover:bg-[#2B2B29]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <FileText className="h-4 w-4 text-[#858585]" strokeWidth={1.85} />
                Terms & Conditions
              </span>
              <ChevronRight className="h-4 w-4 text-[#858585]" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => navigate('about')}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[#F8F7F5]/60 dark:hover:bg-[#2B2B29]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Info className="h-4 w-4 text-[#858585]" strokeWidth={1.85} />
                About App
              </span>
              <ChevronRight className="h-4 w-4 text-[#858585]" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </section>

      <FolderPickerDialog
        open={defaultFolderOpen}
        title="Default Folder"
        folders={folders}
        selectedFolderId={defaultFolderId}
        onSelect={setDefaultFolderId}
        onClose={() => setDefaultFolderOpen(false)}
      />

      <InfoSheetDialog
        open={notifOpen}
        title="Notification Preferences"
        onClose={() => setNotifOpen(false)}
      >
        <div className="divide-y divide-[#EEEEEC] dark:divide-[#2E2E2B]">
          {[
            {
              key: 'dailyReminder' as const,
              title: 'Daily Writing Reminder',
              desc: 'Gentle evening prompt to capture daily notes',
            },
            {
              key: 'weeklyDigest' as const,
              title: 'Weekly Archive Summary',
              desc: 'Recap of newly created and pinned notes',
            },
            {
              key: 'subtleSounds' as const,
              title: 'Subtle Haptic Feedback',
              desc: 'Soft tactile response on checklist completion',
            },
          ].map((item) => {
            const enabled = notifications[item.key];
            return (
              <div key={item.key} className="flex items-center justify-between gap-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-[#202124] dark:text-[#F4F4F2]">
                    {item.title}
                  </p>
                  <p className="text-xs text-[#858585] dark:text-[#9A9A96] mt-0.5">
                    {item.desc}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => updateNotifications({ [item.key]: !enabled })}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer ${
                    enabled ? 'bg-[#D9A928]' : 'bg-[#EEEEEC] dark:bg-[#2E2E2B]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </InfoSheetDialog>

      <InfoSheetDialog
        open={backupOpen}
        title="Backup & Sync"
        onClose={() => setBackupOpen(false)}
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#F8F7F5] dark:bg-[#171717] border border-[#EEEEEC] dark:border-[#2E2E2B] p-4 space-y-1.5">
            <p className="text-sm font-semibold">Local Device Storage</p>
            <p className="text-xs text-[#858585] dark:text-[#9A9A96] tabular-nums">
              {notes.length} total notes across {folders.length} folders are saved on this device.
            </p>
            <p className="text-xs text-[#858585] dark:text-[#9A9A96] pt-1">
              Cloud sync is currently in UI preview mode until a backend storage provider is configured.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportBackup}
            className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#202124] dark:bg-[#D9A928] text-sm font-semibold text-white dark:text-[#171717] cursor-pointer"
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            Export Local Backup (.json)
          </button>
        </div>
      </InfoSheetDialog>

      <InfoSheetDialog
        open={restoreOpen}
        title="Restore Purchase"
        onClose={() => setRestoreOpen(false)}
      >
        <p className="text-sm text-[#858585] dark:text-[#9A9A96]">
          No active payment provider is connected yet. Once billing is configured, previously
          purchased subscriptions can be restored here.
        </p>
      </InfoSheetDialog>

      <InfoSheetDialog
        open={Boolean(legalDoc)}
        title={legalDoc === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
        onClose={() => setLegalDoc(null)}
      >
        {legalDoc === 'privacy' ? (
          <div className="space-y-3 text-sm text-[#858585] dark:text-[#9A9A96]">
            <p>
              Notes stores your notes, folders, and preferences locally in your browser storage.
              No note content is transmitted to external servers in this standalone frontend build.
            </p>
            <p>
              You can export or clear your local workspace data anytime from Settings.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-[#858585] dark:text-[#9A9A96]">
            <p>
              Notes is provided as a calm personal writing and organization workspace. You retain
              full ownership of all content you create inside the application.
            </p>
            <p>
              Optional cloud sync and subscription billing are presented as interface previews
              until external services are connected.
            </p>
          </div>
        )}
      </InfoSheetDialog>
    </NavigationShell>
  );
}
