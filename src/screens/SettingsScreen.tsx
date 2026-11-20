import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Cloud,
  CloudDownload,
  CloudUpload,
  Crown,
  Download,
  FileText,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  Moon,
  RotateCcw,
  Shield,
  ShieldCheck,
  User,
} from 'lucide-react';
import { ConfirmDialog, InfoSheetDialog } from '../components/ConfirmDialog';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { NavigationShell } from '../components/NavigationShell';
import { PinDialog } from '../components/PinDialog';
import { useNotes } from '../context/NotesContext';
import { exportNotesAsPdfZip, exportNotesAsTextZip } from '../utils/exportNotesZip';
import { formatFullDate } from '../utils/noteHelpers';

export function SettingsScreen() {
  const {
    account,
    theme,
    palette,
    isPremium,
    isAdmin,
    notePin,
    setNotePin,
    requestUpgrade,
    folders,
    notes,
    notifications,
    updateNotifications,
    authLoading,
    driveBusy,
    billingBusy,
    signInGoogleAccount,
    backupToGoogleDrive,
    restoreFromGoogleDrive,
    restorePurchase,
    navigate,
    showToast,
  } = useNotes();

  const [notifOpen, setNotifOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [driveBackupConfirmOpen, setDriveBackupConfirmOpen] = useState(false);
  const [driveRestoreConfirmOpen, setDriveRestoreConfirmOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreTxId, setRestoreTxId] = useState('');
  const [restoreStatusMsg, setRestoreStatusMsg] = useState<string | null>(null);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinSheetOpen, setPinSheetOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'txt' | 'pdf' | null>(null);

  const isGuest = account.isGuest !== false;

  const themeLabel =
    theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light';
  const paletteSuffix =
    isPremium && palette !== 'default'
      ? ` · ${palette.charAt(0).toUpperCase() + palette.slice(1)}`
      : '';

  const initials = (account.name || '')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleExportZip = async (format: 'txt' | 'pdf') => {
    if (exportingFormat) return;
    setExportingFormat(format);
    try {
      const result =
        format === 'txt'
          ? await exportNotesAsTextZip(notes, folders)
          : await exportNotesAsPdfZip(notes, folders);
      showToast(
        result.mode === 'shared'
          ? `Prepared ${result.count} ${format.toUpperCase()} notes in ZIP`
          : `Downloaded ${result.count} ${format.toUpperCase()} notes as ZIP`
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Export unavailable',
        'danger'
      );
    } finally {
      setExportingFormat(null);
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
              {!isGuest && account.photoUrl && !avatarError ? (
                <img
                  src={account.photoUrl}
                  alt={account.name}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="h-12 w-12 shrink-0 rounded-full object-cover border border-[var(--divider)]"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-primary)]">
                  {isGuest ? <User className="h-5 w-5" /> : initials || <User className="h-5 w-5" />}
                </span>
              )}
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[15px] font-semibold text-[var(--text-primary)] truncate">
                    {isGuest ? 'Guest Account' : account.name}
                  </span>
                  {!isGuest && account.emailVerified && (
                    <CheckCircle2
                      className="h-3.5 w-3.5 shrink-0 text-[#2E7D32] dark:text-[#81C995]"
                      strokeWidth={2.25}
                    />
                  )}
                </span>
                <span className="block text-xs text-[var(--text-secondary)] truncate">
                  {isGuest ? 'Sign in with Google to back up' : account.email}
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
                <span>{!isGuest ? 'Google Drive' : 'Local'}</span>
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

        {isAdmin && (
          <div>
            <h2 className="px-1 mb-2 text-xs font-semibold text-[var(--text-secondary)]">
              Admin
            </h2>
            <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)]">
              <button
                type="button"
                onClick={() => navigate('admin')}
                className="flex w-full min-h-[54px] items-center justify-between px-4 text-left hover:bg-[var(--bg-subtle)]/50 transition-colors cursor-pointer rounded-2xl"
              >
                <span className="flex items-center gap-3 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4 text-[var(--accent-primary)]" strokeWidth={1.9} />
                  Admin Panel
                </span>
                <ChevronRight className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        )}
      </section>

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

          <div className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--divider)] p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold">Google Drive Backup</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {isGuest
                  ? 'Sign in with Google to save and restore your notes via Google Drive.'
                  : account.lastDriveBackupAt
                  ? `Signed in as ${account.email} · Last backup ${formatFullDate(account.lastDriveBackupAt)}`
                  : `Signed in as ${account.email} · Ready to back up`}
              </p>
            </div>

            {isGuest ? (
              <GoogleSignInButton onClick={signInGoogleAccount} loading={authLoading} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={driveBusy}
                  onClick={() => setDriveBackupConfirmOpen(true)}
                  className="flex w-full min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-3 text-xs font-semibold text-white dark:text-[#171717] disabled:opacity-60 cursor-pointer"
                >
                  {driveBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CloudUpload className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  Back Up Now
                </button>
                <button
                  type="button"
                  disabled={driveBusy}
                  onClick={() => setDriveRestoreConfirmOpen(true)}
                  className="flex w-full min-h-[42px] items-center justify-center gap-2 rounded-xl border border-[var(--divider)] bg-[var(--bg-card)] px-3 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-60 cursor-pointer"
                >
                  {driveBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CloudDownload className="h-3.5 w-3.5" strokeWidth={2} />
                  )}
                  Restore
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={Boolean(exportingFormat)}
              onClick={() => {
                void handleExportZip('txt');
              }}
              className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl border border-[var(--divider)] bg-[var(--bg-canvas)] px-4 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] disabled:opacity-60 transition-colors cursor-pointer"
            >
              {exportingFormat === 'txt' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" strokeWidth={2} />
              )}
              Download Text (.zip)
            </button>

            <button
              type="button"
              disabled={Boolean(exportingFormat)}
              onClick={() => {
                void handleExportZip('pdf');
              }}
              className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] px-4 text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] disabled:opacity-60 transition-opacity hover:opacity-90 cursor-pointer"
            >
              {exportingFormat === 'pdf' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" strokeWidth={2} />
              )}
              Download PDF (.zip)
            </button>
          </div>
        </div>
      </InfoSheetDialog>

      <ConfirmDialog
        open={driveBackupConfirmOpen}
        title="Back up to Google Drive?"
        description={`This will save your ${notes.length} notes and ${folders.length} folders to notes-app-backup.json in your Google Drive (${account.email}).`}
        confirmLabel="Back Up Now"
        danger={false}
        onConfirm={() => {
          void backupToGoogleDrive();
        }}
        onClose={() => setDriveBackupConfirmOpen(false)}
      />

      <ConfirmDialog
        open={driveRestoreConfirmOpen}
        title="Restore from Google Drive?"
        description="This will replace your current local notes and folders with the backup stored in your Google Drive."
        confirmLabel="Restore Backup"
        onConfirm={() => {
          void restoreFromGoogleDrive();
        }}
        onClose={() => setDriveRestoreConfirmOpen(false)}
      />

      <InfoSheetDialog
        open={restoreOpen}
        title="Restore Purchase"
        onClose={() => {
          setRestoreOpen(false);
          setRestoreStatusMsg(null);
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {account.email
              ? `Verify purchases linked to ${account.email} or enter a verified SSLCommerz / Binance Pay transaction ID.`
              : 'Enter your payment Transaction ID or sign in with Google to restore an active subscription.'}
          </p>

          <input
            type="text"
            value={restoreTxId}
            onChange={(e) => setRestoreTxId(e.target.value)}
            placeholder="Transaction ID (optional)"
            aria-label="Transaction ID"
            className="w-full min-h-[44px] rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
          />

          {restoreStatusMsg && (
            <p className="text-xs text-[var(--text-secondary)]">{restoreStatusMsg}</p>
          )}

          <button
            type="button"
            disabled={billingBusy}
            onClick={() => {
              void restorePurchase(restoreTxId).then((res) => {
                setRestoreStatusMsg(res.message);
                if (res.restored) {
                  setRestoreOpen(false);
                }
              });
            }}
            className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] disabled:opacity-60 cursor-pointer"
          >
            {billingBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify & Restore Purchase
          </button>
        </div>
      </InfoSheetDialog>

      <InfoSheetDialog
        open={Boolean(legalDoc)}
        title={legalDoc === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
        onClose={() => setLegalDoc(null)}
      >
        {legalDoc === 'privacy' ? (
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>
              Notes stores your notes, folders, and preferences locally on your device. If you
              continue in Guest mode, nothing leaves your device unless you choose to translate a
              selected text snippet.
            </p>
            <p>
              If you sign in with Google, your display name, verified email, and profile photo are
              used only for your account profile, and Google Drive backups are saved exclusively to
              your own Drive file (<span className="font-medium text-[var(--text-primary)]">notes-app-backup.json</span>)
              only when you confirm a backup or restore action.
            </p>
            <p>
              Voice typing uses your device or browser speech recognition engine. You can sign out,
              export, or clear your local workspace data anytime from Settings or Account.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>
              Notes is a personal writing and organization workspace. You retain full ownership and
              control of all notes, sketches, images, and folders you create inside the app.
            </p>
            <p>
              Google Sign-In and Google Drive backup are optional features for personal cloud
              backup. Translation relies on third-party translation endpoints only for the text you
              explicitly select to translate.
            </p>
            <p>
              Subscription billing and purchase restoration will connect to the configured payment
              provider once enabled.
            </p>
          </div>
        )}
      </InfoSheetDialog>
    </NavigationShell>
  );
}
