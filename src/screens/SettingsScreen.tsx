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
  Lock,
  Moon,
  RotateCcw,
  Shield,
  User,
} from 'lucide-react';
import { FolderPickerDialog, InfoSheetDialog } from '../components/ConfirmDialog';
import { NavigationShell } from '../components/NavigationShell';
import { PinDialog } from '../components/PinDialog';
import { useNotes } from '../context/NotesContext';

export function SettingsScreen() {
  const {
    account,
    theme,
    palette,
    isPremium,
    notePin,
    setNotePin,
    requestUpgrade,
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
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);

  const defaultFolder = getFolderById(defaultFolderId) || folders[0];
  const themeLabel =
    theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light';
  const paletteSuffix =
    isPremium && palette !== 'default'
      ? ` · ${palette.charAt(0).toUpperCase() + palette.slice(1)}`
      : '';

  const initials = account.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleExportBackup = () => {
    try {
      const payload = JSON.stringify(
        { notes, folders, exportedAt: new Date().toISOString() },
        null,
        2
      );
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

  const handleNotePinClick = () => {
    if (!isPremium) {
      requestUpgrade('Secure Note Lock with 4-digit PIN is a Notes Premium feature.');
      return;
    }
    if (notePin) {
      setPinSheetOpen(true);
    } else {
      setPinDialogOpen(true);
    }
  };

  return (
    <NavigationShell showMobileTabs>
      <header className="sticky top-0 z-20 bg-[var(--bg-canvas)]/95 backdrop-blur-md px-5 sm:px-8 pt-5 pb-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Settings
        </h1>
      </header>

      <section className="px-5 sm:px-8 pt-2 space-y-6">
        {/* Account Card */}
        <div>
          <h2 className="px-1 mb-2 text-xs font-semibold text-[var(--text-secondary)]">
            Account
          </h2>
          <button
            type="button"
            onClick={() => navigate('account')}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] p-4 text-left hover:border-[var(--accent-primary)]/60 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-3.5 min-w-0">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-primary)]">
                {initials || <User className="h-5 w-5" />}
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-[var(--text-primary)] truncate">
                  {account.name || 'Local Profile'}
                </span>
                <span className="block text-xs text-[var(--text-secondary)] truncate">
                  {account.email || 'Tap to manage account'}
                </span>
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--text-secondary)]" strokeWidth={1.75} />
          </button>
        </div>

        {/* Preferences */}
        <div>
          <h2 className="px-1 mb-2 text-xs font-semibold text-[var(--text-secondary)]">
            Preferences
          </h2>
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] divide-y divide-[var(--divider)]">
            <button
              type="button"
              onClick={() => navigate('appearance')}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Moon className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                Appearance
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span>
                  {themeLabel}
                  {paletteSuffix}
                </span>
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDefaultFolderOpen(true)}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Folder className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                Default Folder
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span>{defaultFolder?.name || 'Personal'}</span>
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </button>

            <button
              type="button"
              onClick={handleNotePinClick}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Lock className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                Note Lock PIN
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span>{!isPremium ? 'Premium' : notePin ? 'Enabled' : 'Off'}</span>
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setNotifOpen(true)}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Bell className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                Notification Preferences
              </span>
              <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Storage */}
        <div>
          <h2 className="px-1 mb-2 text-xs font-semibold text-[var(--text-secondary)]">
            Storage
          </h2>
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)]">
            <button
              type="button"
              onClick={() => setBackupOpen(true)}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer rounded-2xl"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Cloud className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                Backup & Sync
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span>{isPremium ? 'Cloud Preview' : 'Local'}</span>
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </button>
          </div>
        </div>

        {/* Premium */}
        <div>
          <h2 className="px-1 mb-2 text-xs font-semibold text-[var(--text-secondary)]">
            Premium
          </h2>
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] divide-y divide-[var(--divider)]">
            <button
              type="button"
              onClick={() => navigate('premium')}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Crown className="h-4 w-4 text-[var(--accent-primary)]" strokeWidth={1.9} />
                Subscription
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <span>{isPremium ? 'Premium' : 'Free'}</span>
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRestoreOpen(true)}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <RotateCcw className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                Restore Purchase
              </span>
              <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Support */}
        <div>
          <h2 className="px-1 mb-2 text-xs font-semibold text-[var(--text-secondary)]">
            Support
          </h2>
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] divide-y divide-[var(--divider)]">
            <button
              type="button"
              onClick={() => navigate('help')}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <HelpCircle className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                Help & Support
              </span>
              <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => setLegalDoc('privacy')}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Shield className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                Privacy Policy
              </span>
              <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => setLegalDoc('terms')}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <FileText className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                Terms & Conditions
              </span>
              <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => navigate('about')}
              className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Info className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                About App
              </span>
              <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
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
        open={pinSheetOpen}
        title="Note Lock PIN"
        onClose={() => setPinSheetOpen(false)}
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Your 4-digit PIN is active for protecting locked notes on this device.
          </p>
          <button
            type="button"
            onClick={() => {
              setPinSheetOpen(false);
              setPinDialogOpen(true);
            }}
            className="w-full min-h-[44px] rounded-xl bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] cursor-pointer"
          >
            Change 4-Digit PIN
          </button>
          <button
            type="button"
            onClick={() => {
              setNotePin(null);
              setPinSheetOpen(false);
            }}
            className="w-full min-h-[44px] rounded-xl bg-[#E45B5B]/10 text-sm font-semibold text-[#E45B5B] cursor-pointer"
          >
            Remove PIN & Unlock All Notes
          </button>
        </div>
      </InfoSheetDialog>

      <PinDialog
        open={pinDialogOpen}
        mode="create"
        onSuccess={(newPin) => setNotePin(newPin)}
        onClose={() => setPinDialogOpen(false)}
      />

      <InfoSheetDialog
        open={notifOpen}
        title="Notification Preferences"
        onClose={() => setNotifOpen(false)}
      >
        <div className="divide-y divide-[var(--divider)]">
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
                  <p className="text-sm font-medium text-[var(--text-primary)]">{item.title}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => updateNotifications({ [item.key]: !enabled })}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer ${
                    enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--divider)]'
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
          <div className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--divider)] p-4 space-y-1.5">
            <p className="text-sm font-semibold">Local Device Storage</p>
            <p className="text-xs text-[var(--text-secondary)] tabular-nums">
              {notes.length} total notes across {folders.length} folders are saved on this device.
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--divider)] p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Auto Cloud Backup</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {isPremium
                  ? 'Ready to sync once a cloud backend is configured.'
                  : 'Included in Notes Premium.'}
              </p>
            </div>
            {!isPremium && (
              <button
                type="button"
                onClick={() => {
                  setBackupOpen(false);
                  requestUpgrade('Automatic Cloud Backup is included with Notes Premium.');
                }}
                className="min-h-[34px] px-3 rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent-primary)] shrink-0 cursor-pointer"
              >
                Upgrade
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportBackup}
            className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] cursor-pointer"
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
        <p className="text-sm text-[var(--text-secondary)]">
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
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>
              Notes stores your notes, folders, and preferences locally in your browser storage.
              No note content is transmitted to external servers in this standalone frontend build.
            </p>
            <p>You can export or clear your local workspace data anytime from Settings.</p>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
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
