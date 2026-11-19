import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  Clock,
  LayoutDashboard,
  Loader2,
  Menu,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { getPreviewDurationMs } from '../services/adminConfigService';
import { formatFullDate } from '../utils/noteHelpers';

type AdminModule = 'overview' | 'preview-timer';

export function AdminPanelScreen() {
  const {
    account,
    isAdmin,
    previewConfig,
    previewSyncState,
    previewSyncError,
    adminSaving,
    updateAdminPreviewConfig,
    goBack,
  } = useNotes();

  const [activeModule, setActiveModule] = useState<AdminModule>('preview-timer');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [enabled, setEnabled] = useState<boolean>(previewConfig.enabled);
  const [days, setDays] = useState<string>(String(previewConfig.days));
  const [hours, setHours] = useState<string>(String(previewConfig.hours));
  const [minutes, setMinutes] = useState<string>(String(previewConfig.minutes));
  const [seconds, setSeconds] = useState<string>(String(previewConfig.seconds));

  useEffect(() => {
    setEnabled(previewConfig.enabled);
    setDays(String(previewConfig.days));
    setHours(String(previewConfig.hours));
    setMinutes(String(previewConfig.minutes));
    setSeconds(String(previewConfig.seconds));
  }, [previewConfig]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E45B5B]/10 text-[#E45B5B] mb-4">
          <ShieldAlert className="h-7 w-7" strokeWidth={1.85} />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Admin Access Required</h1>
        <p className="mt-1.5 max-w-xs text-sm text-[var(--text-secondary)]">
          Sign in with the authorized administrator account to open this dashboard.
        </p>
        <button
          type="button"
          onClick={goBack}
          className="mt-6 min-h-[44px] rounded-full bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] px-6 text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] cursor-pointer"
        >
          Back
        </button>
      </div>
    );
  }

  const navItems: Array<{ id: AdminModule; label: string; icon: typeof LayoutDashboard }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'preview-timer', label: 'Preview Timer', icon: Clock },
  ];

  const totalConfiguredMs = getPreviewDurationMs(previewConfig);

  const formatDurationSummary = () => {
    const parts: string[] = [];
    if (previewConfig.days > 0) parts.push(`${previewConfig.days}d`);
    if (previewConfig.hours > 0) parts.push(`${previewConfig.hours}h`);
    if (previewConfig.minutes > 0) parts.push(`${previewConfig.minutes}m`);
    if (previewConfig.seconds > 0 || parts.length === 0) parts.push(`${previewConfig.seconds}s`);
    return parts.join(' ');
  };

  const parseField = (raw: string, max: number) => {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(max, Math.floor(n));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAdminPreviewConfig({
      enabled,
      days: parseField(days, 3650),
      hours: parseField(hours, 23),
      minutes: parseField(minutes, 59),
      seconds: parseField(seconds, 59),
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-[var(--divider)] bg-[var(--bg-card)] shrink-0">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[var(--divider)]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
            <ShieldCheck className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight truncate">Notes Admin</p>
            <p className="text-xs text-[var(--text-secondary)] truncate">{account.email}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveModule(item.id)}
                className={`flex w-full min-h-[44px] items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--divider)]">
          <button
            type="button"
            onClick={goBack}
            className="flex w-full min-h-[42px] items-center gap-2.5 rounded-xl px-3.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            <span>Back to Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-[var(--bg-canvas)]/95 backdrop-blur-md border-b border-[var(--divider)] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="md:hidden min-h-[42px] min-w-[42px] flex items-center justify-center rounded-full text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate">
              {activeModule === 'overview' ? 'Overview' : 'Preview Timer'}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Toggle admin menu"
            className="md:hidden min-h-[42px] min-w-[42px] flex items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--divider)] text-[var(--text-primary)] cursor-pointer"
          >
            {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </header>

        {/* Mobile Module Navigation */}
        {mobileNavOpen && (
          <div className="md:hidden border-b border-[var(--divider)] bg-[var(--bg-card)] px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveModule(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`flex w-full min-h-[44px] items-center gap-3 rounded-xl px-3.5 text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <main className="flex-1 p-5 sm:p-8 max-w-2xl w-full mx-auto">
          {activeModule === 'overview' ? (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)]">
                      Preview Mode Card
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {previewConfig.enabled && totalConfiguredMs > 0 ? 'Active' : 'Hidden'}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
                    <Clock className="h-5 w-5" strokeWidth={1.85} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--divider)]">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Allowed Duration</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">
                      {formatDurationSummary()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Sync Status</p>
                    <p className="mt-0.5 text-sm font-semibold capitalize">{previewSyncState}</p>
                  </div>
                </div>

                {previewConfig.updatedAt && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    Last updated: {formatFullDate(previewConfig.updatedAt)}
                  </p>
                )}

                {previewSyncError && (
                  <p className="text-xs text-[#E45B5B]">{previewSyncError}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveModule('preview-timer')}
                className="w-full min-h-[48px] rounded-xl bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] cursor-pointer"
              >
                Configure Preview Timer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Enable Preview Mode</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Guest and Free accounts can use Preview Mode until their timer expires.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => setEnabled((prev) => !prev)}
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

              <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] p-5 space-y-4">
                <p className="text-sm font-semibold">Trial Duration</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <input
                    type="number"
                    min={0}
                    max={3650}
                    inputMode="numeric"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder="Days"
                    aria-label="Days"
                    className="w-full min-h-[46px] rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
                  />
                  <input
                    type="number"
                    min={0}
                    max={23}
                    inputMode="numeric"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="Hours"
                    aria-label="Hours"
                    className="w-full min-h-[46px] rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
                  />
                  <input
                    type="number"
                    min={0}
                    max={59}
                    inputMode="numeric"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    placeholder="Minutes"
                    aria-label="Minutes"
                    className="w-full min-h-[46px] rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
                  />
                  <input
                    type="number"
                    min={0}
                    max={59}
                    inputMode="numeric"
                    value={seconds}
                    onChange={(e) => setSeconds(e.target.value)}
                    placeholder="Seconds"
                    aria-label="Seconds"
                    className="w-full min-h-[46px] rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] tabular-nums"
                  />
                </div>

                {previewSyncError && (
                  <p className="text-xs text-[#E45B5B]">{previewSyncError}</p>
                )}

                <button
                  type="submit"
                  disabled={adminSaving}
                  className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] disabled:opacity-60 transition-opacity hover:opacity-90 cursor-pointer"
                >
                  {adminSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Preview Timer
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
