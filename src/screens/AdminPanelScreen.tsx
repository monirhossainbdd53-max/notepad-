import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ImagePlus,
  LayoutDashboard,
  Loader2,
  Mail,
  Menu,
  MessageSquare,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import {
  compressTeamPhotoFile,
  SOCIAL_PLATFORM_OPTIONS,
} from '../services/aboutAppService';
import { getPreviewDurationMs } from '../services/adminConfigService';
import {
  buildSupportReplyMailto,
  replyToSupportMessage,
  subscribeSupportMessages,
} from '../services/supportService';
import {
  AboutSocialLink,
  AboutTeamMember,
  SocialPlatformId,
  SupportMessage,
} from '../types/notes';
import { formatFullDate, generateId } from '../utils/noteHelpers';

type AdminModule = 'overview' | 'preview-timer' | 'support' | 'about';
type SupportFilter = 'all' | 'open' | 'replied';

export function AdminPanelScreen() {
  const {
    account,
    isAdmin,
    previewConfig,
    previewSyncState,
    previewSyncError,
    adminSaving,
    updateAdminPreviewConfig,
    aboutConfig,
    aboutSaving,
    updateAdminAboutConfig,
    goBack,
    showToast,
  } = useNotes();

  const [activeModule, setActiveModule] = useState<AdminModule>('preview-timer');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [enabled, setEnabled] = useState<boolean>(previewConfig.enabled);
  const [days, setDays] = useState<string>(String(previewConfig.days));
  const [hours, setHours] = useState<string>(String(previewConfig.hours));
  const [minutes, setMinutes] = useState<string>(String(previewConfig.minutes));
  const [seconds, setSeconds] = useState<string>(String(previewConfig.seconds));

  const [ceoDraft, setCeoDraft] = useState<AboutTeamMember | null>(aboutConfig.ceo);
  const [teamDraft, setTeamDraft] = useState<AboutTeamMember[]>(aboutConfig.team);
  const [socialsDraft, setSocialsDraft] = useState<AboutSocialLink[]>(aboutConfig.socials);
  const [selectedSocialToAdd, setSelectedSocialToAdd] = useState<SocialPlatformId>('facebook');

  const [supportTickets, setSupportTickets] = useState<SupportMessage[]>([]);
  const [supportSyncError, setSupportSyncError] = useState<string | null>(null);
  const [supportFilter, setSupportFilter] = useState<SupportFilter>('all');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  useEffect(() => {
    setEnabled(previewConfig.enabled);
    setDays(String(previewConfig.days));
    setHours(String(previewConfig.hours));
    setMinutes(String(previewConfig.minutes));
    setSeconds(String(previewConfig.seconds));
  }, [previewConfig]);

  useEffect(() => {
    setCeoDraft(aboutConfig.ceo);
    setTeamDraft(aboutConfig.team);
    setSocialsDraft(aboutConfig.socials);
  }, [aboutConfig]);

  useEffect(() => {
    if (!isAdmin) return;
    setSupportSyncError(null);
    const unsubscribe = subscribeSupportMessages(
      (items) => {
        setSupportTickets(items);
        setSupportSyncError(null);
      },
      (errMsg) => {
        setSupportSyncError(errMsg);
      }
    );
    return () => unsubscribe();
  }, [isAdmin]);

  const openTicketCount = useMemo(
    () => supportTickets.filter((t) => t.status === 'open').length,
    [supportTickets]
  );

  const filteredTickets = useMemo(() => {
    if (supportFilter === 'all') return supportTickets;
    return supportTickets.filter((t) => t.status === supportFilter);
  }, [supportFilter, supportTickets]);

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

  const navItems: Array<{
    id: AdminModule;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'preview-timer', label: 'Preview Timer', icon: Clock },
    {
      id: 'support',
      label: 'Support Messages',
      icon: MessageSquare,
      badge: openTicketCount > 0 ? openTicketCount : undefined,
    },
    { id: 'about', label: 'About App', icon: Users },
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

  const handleSendReply = async (ticket: SupportMessage) => {
    const draft = (replyDrafts[ticket.id] || '').trim();
    if (!draft || replyingId) return;
    setReplyingId(ticket.id);
    try {
      const res = await replyToSupportMessage(ticket, draft);
      setReplyDrafts((prev) => ({ ...prev, [ticket.id]: '' }));
      showToast(res.statusMessage);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not send reply',
        'danger'
      );
    } finally {
      setReplyingId(null);
    }
  };

  const handlePhotoUpload = async (
    file: File | undefined,
    onDone: (compressedDataUrl: string) => void
  ) => {
    if (!file) return;
    try {
      const dataUrl = await compressTeamPhotoFile(file);
      onDone(dataUrl);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Invalid photo', 'danger');
    }
  };

  const availableSocialOptions = SOCIAL_PLATFORM_OPTIONS.filter(
    (opt) => !socialsDraft.some((s) => s.id === opt.id)
  );

  const handleAddSocialLink = () => {
    const targetId = availableSocialOptions.some((o) => o.id === selectedSocialToAdd)
      ? selectedSocialToAdd
      : availableSocialOptions[0]?.id;
    const opt = SOCIAL_PLATFORM_OPTIONS.find((o) => o.id === targetId);
    if (!opt) return;
    setSocialsDraft((prev) => [
      ...prev,
      {
        id: opt.id,
        label: opt.label,
        href: '',
        enabled: true,
      },
    ]);
    const remaining = availableSocialOptions.filter((o) => o.id !== opt.id);
    if (remaining[0]) {
      setSelectedSocialToAdd(remaining[0].id);
    }
  };

  const handleAddCeo = () => {
    setCeoDraft({
      id: 'ceo',
      name: '',
      role: 'Founder & CEO',
      image: '',
    });
  };

  const handleAddTeamMember = () => {
    setTeamDraft((prev) => [
      ...prev,
      {
        id: generateId('member'),
        name: '',
        role: '',
        image: '',
      },
    ]);
  };

  const handleMoveTeamMember = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= teamDraft.length) return;
    setTeamDraft((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const handleSaveAboutApp = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAdminAboutConfig({
      ceo: ceoDraft,
      team: teamDraft,
      socials: socialsDraft,
    });
  };

  const headerTitle =
    activeModule === 'overview'
      ? 'Overview'
      : activeModule === 'support'
      ? 'Support Messages'
      : activeModule === 'about'
      ? 'About App'
      : 'Preview Timer';

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
                className={`flex w-full min-h-[44px] items-center justify-between gap-2 rounded-xl px-3.5 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.badge === 'number' && (
                  <span className="rounded-lg bg-[var(--accent-primary)] px-1.5 py-0.5 text-[11px] font-bold text-white dark:text-[#171717] tabular-nums">
                    {item.badge}
                  </span>
                )}
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
              {headerTitle}
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
                  className={`flex w-full min-h-[44px] items-center justify-between gap-2 rounded-xl px-3.5 text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.9} />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {typeof item.badge === 'number' && (
                    <span className="rounded-lg bg-[var(--accent-primary)] px-1.5 py-0.5 text-[11px] font-bold text-white dark:text-[#171717] tabular-nums">
                      {item.badge}
                    </span>
                  )}
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

              <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] p-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[var(--text-secondary)]">
                    Support Inbox
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums">
                    {openTicketCount} open · {supportTickets.length} total
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModule('support')}
                  className="min-h-[40px] rounded-xl bg-[var(--bg-subtle)] px-4 text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
                >
                  Open Inbox
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveModule('preview-timer')}
                className="w-full min-h-[48px] rounded-xl bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] cursor-pointer"
              >
                Configure Preview Timer
              </button>
            </div>
          ) : activeModule === 'support' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {(['all', 'open', 'replied'] as const).map((filter) => {
                  const active = supportFilter === filter;
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setSupportFilter(filter)}
                      className={`min-h-[38px] rounded-xl px-4 text-xs font-semibold capitalize transition-colors cursor-pointer ${
                        active
                          ? 'bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] text-[var(--bg-card)] dark:text-[#171717]'
                          : 'bg-[var(--bg-card)] border border-[var(--divider)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>

              {supportSyncError && (
                <div className="rounded-2xl bg-[#E45B5B]/10 border border-[#E45B5B]/30 p-4 text-xs text-[#E45B5B]">
                  {supportSyncError}
                </div>
              )}

              {filteredTickets.length === 0 ? (
                <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] p-8 text-center">
                  <MessageSquare className="h-7 w-7 mx-auto text-[var(--text-secondary)] opacity-60" strokeWidth={1.75} />
                  <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                    No support messages yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => {
                    const draft = replyDrafts[ticket.id] ?? '';
                    const isSending = replyingId === ticket.id;
                    const mailtoHref = buildSupportReplyMailto(
                      ticket,
                      draft.trim() || ticket.adminReply || ''
                    );

                    return (
                      <div
                        key={ticket.id}
                        className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] p-5 space-y-3.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-[var(--text-primary)] break-words">
                              {ticket.subject}
                            </h3>
                            <p className="mt-0.5 text-xs text-[var(--text-secondary)] break-all">
                              {ticket.userName} · {ticket.userEmail}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                              ticket.status === 'replied'
                                ? 'bg-[#2E7D32]/12 text-[#2E7D32] dark:text-[#81C995]'
                                : 'bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                            }`}
                          >
                            {ticket.status === 'replied' ? 'Replied' : 'Open'}
                          </span>
                        </div>

                        <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] p-3.5">
                          {ticket.message}
                        </p>

                        {ticket.createdAt && (
                          <p className="text-[11px] text-[var(--text-secondary)]">
                            {formatFullDate(ticket.createdAt)}
                          </p>
                        )}

                        {ticket.adminReply && (
                          <div className="rounded-xl bg-[var(--accent-soft)]/50 border border-[var(--accent-primary)]/25 p-3.5 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-primary)]">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Admin Reply
                              </span>
                              <span className="text-[11px] text-[var(--text-secondary)]">
                                {ticket.emailDeliveryStatus === 'sent'
                                  ? 'Emailed'
                                  : ticket.repliedAt
                                  ? formatFullDate(ticket.repliedAt)
                                  : 'Saved'}
                              </span>
                            </div>
                            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                              {ticket.adminReply}
                            </p>
                          </div>
                        )}

                        <div className="space-y-2.5 pt-1">
                          <textarea
                            value={draft}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({
                                ...prev,
                                [ticket.id]: e.target.value,
                              }))
                            }
                            placeholder="Write your reply..."
                            aria-label="Reply message"
                            rows={3}
                            className="w-full rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] p-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                          />

                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              disabled={!draft.trim() || isSending}
                              onClick={() => void handleSendReply(ticket)}
                              className="flex-1 min-h-[42px] flex items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] px-4 text-xs font-semibold text-[var(--bg-card)] dark:text-[#171717] disabled:opacity-40 cursor-pointer"
                            >
                              {isSending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-3.5 w-3.5" strokeWidth={2} />
                              )}
                              {isSending ? 'Sending...' : 'Send Reply'}
                            </button>

                            <a
                              href={mailtoHref}
                              className="min-h-[42px] flex items-center justify-center gap-2 rounded-xl border border-[var(--divider)] bg-[var(--bg-canvas)] px-4 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5" strokeWidth={2} />
                              Send via Email App
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeModule === 'about' ? (
            <form onSubmit={handleSaveAboutApp} className="space-y-6">
              {/* Social Media Controls */}
              <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] p-5 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <p className="text-sm font-semibold">Social Media Links</p>
                  {availableSocialOptions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        value={
                          availableSocialOptions.some((o) => o.id === selectedSocialToAdd)
                            ? selectedSocialToAdd
                            : availableSocialOptions[0].id
                        }
                        onChange={(e) =>
                          setSelectedSocialToAdd(e.target.value as SocialPlatformId)
                        }
                        aria-label="Select social platform"
                        className="min-h-[36px] rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] px-3 text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      >
                        {availableSocialOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddSocialLink}
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-xl bg-[var(--accent-soft)] px-3 text-xs font-semibold text-[var(--accent-primary)] cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
                        Add
                      </button>
                    </div>
                  )}
                </div>

                {socialsDraft.length === 0 ? (
                  <div className="rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] p-4 text-center text-xs text-[var(--text-secondary)]">
                    No social media links added yet
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--divider)]">
                    {socialsDraft.map((item, idx) => {
                      const optMeta = SOCIAL_PLATFORM_OPTIONS.find((o) => o.id === item.id);
                      return (
                        <div key={item.id} className="py-3 first:pt-1 last:pb-1 space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-[var(--text-primary)]">
                              {item.label}
                            </span>
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={item.enabled}
                                onClick={() =>
                                  setSocialsDraft((prev) =>
                                    prev.map((s, i) =>
                                      i === idx ? { ...s, enabled: !s.enabled } : s
                                    )
                                  )
                                }
                                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                                  item.enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--divider)]'
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                                    item.enabled ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setSocialsDraft((prev) => prev.filter((_, i) => i !== idx))
                                }
                                aria-label={`Remove ${item.label}`}
                                className="min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg bg-[#E45B5B]/10 text-[#E45B5B] cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                              </button>
                            </div>
                          </div>
                          <input
                            type="url"
                            value={item.href}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSocialsDraft((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, href: val } : s))
                              );
                            }}
                            placeholder={optMeta?.placeholder || `${item.label} URL`}
                            aria-label={`${item.label} URL`}
                            className="w-full min-h-[42px] rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Leadership: CEO (Top Card) */}
              <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">CEO (Top Profile)</p>
                  {!ceoDraft && (
                    <button
                      type="button"
                      onClick={handleAddCeo}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[var(--accent-soft)] px-3 text-xs font-semibold text-[var(--accent-primary)] cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
                      Add CEO
                    </button>
                  )}
                </div>

                {!ceoDraft ? (
                  <div className="rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] p-4 text-center text-xs text-[var(--text-secondary)]">
                    No CEO profile added yet
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--divider)] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--bg-subtle)] flex items-center justify-center">
                          {ceoDraft.image ? (
                            <img
                              src={ceoDraft.image}
                              alt={ceoDraft.name || 'CEO'}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover object-top"
                            />
                          ) : (
                            <User className="h-6 w-6 text-[var(--text-secondary)] opacity-60" strokeWidth={1.75} />
                          )}
                        </div>
                        <label className="inline-flex min-h-[38px] items-center gap-2 rounded-xl border border-[var(--divider)] bg-[var(--bg-card)] px-3.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer">
                          <ImagePlus className="h-3.5 w-3.5" />
                          <span>{ceoDraft.image ? 'Change Photo' : 'Upload Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = '';
                              void handlePhotoUpload(file, (url) =>
                                setCeoDraft((prev) => (prev ? { ...prev, image: url } : prev))
                              );
                            }}
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCeoDraft(null)}
                        aria-label="Remove CEO"
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-[#E45B5B]/10 text-[#E45B5B] cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={ceoDraft.name}
                        onChange={(e) =>
                          setCeoDraft((prev) =>
                            prev ? { ...prev, name: e.target.value } : prev
                          )
                        }
                        placeholder="CEO name"
                        aria-label="CEO Name"
                        className="w-full min-h-[42px] rounded-xl bg-[var(--bg-card)] border border-[var(--divider)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      />
                      <input
                        type="text"
                        value={ceoDraft.role}
                        onChange={(e) =>
                          setCeoDraft((prev) =>
                            prev ? { ...prev, role: e.target.value } : prev
                          )
                        }
                        placeholder="Role / Title"
                        aria-label="CEO Role"
                        className="w-full min-h-[42px] rounded-xl bg-[var(--bg-card)] border border-[var(--divider)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
                      />
                    </div>

                    <input
                      type="url"
                      value={ceoDraft.image.startsWith('data:') ? '' : ceoDraft.image}
                      onChange={(e) =>
                        setCeoDraft((prev) =>
                          prev ? { ...prev, image: e.target.value } : prev
                        )
                      }
                      placeholder="Photo URL (optional)"
                      aria-label="CEO Photo URL"
                      className="w-full min-h-[42px] rounded-xl bg-[var(--bg-card)] border border-[var(--divider)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>
                )}
              </div>

              {/* Team Members Controls (Sequential Grid Below CEO) */}
              <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Team Members</p>
                  <button
                    type="button"
                    onClick={handleAddTeamMember}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[var(--accent-soft)] px-3 text-xs font-semibold text-[var(--accent-primary)] cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Add Member
                  </button>
                </div>

                {teamDraft.length === 0 ? (
                  <div className="rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] p-4 text-center text-xs text-[var(--text-secondary)]">
                    No team members added yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamDraft.map((member, idx) => (
                      <div
                        key={member.id}
                        className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--divider)] p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-12 shrink-0 overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--bg-subtle)] flex items-center justify-center">
                              {member.image ? (
                                <img
                                  src={member.image}
                                  alt={member.name || 'Member'}
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full object-cover object-top"
                                />
                              ) : (
                                <User className="h-5 w-5 text-[var(--text-secondary)] opacity-60" strokeWidth={1.75} />
                              )}
                            </div>
                            <label className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[var(--divider)] bg-[var(--bg-card)] px-3 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer">
                              <ImagePlus className="h-3.5 w-3.5" />
                              <span>{member.image ? 'Change Photo' : 'Upload Photo'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = '';
                                  void handlePhotoUpload(file, (url) =>
                                    setTeamDraft((prev) =>
                                      prev.map((m, i) =>
                                        i === idx ? { ...m, image: url } : m
                                      )
                                    )
                                  );
                                }}
                              />
                            </label>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveTeamMember(idx, -1)}
                              aria-label="Move up"
                              className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl border border-[var(--divider)] bg-[var(--bg-card)] text-[var(--text-secondary)] disabled:opacity-35 cursor-pointer"
                            >
                              <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              disabled={idx === teamDraft.length - 1}
                              onClick={() => handleMoveTeamMember(idx, 1)}
                              aria-label="Move down"
                              className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl border border-[var(--divider)] bg-[var(--bg-card)] text-[var(--text-secondary)] disabled:opacity-35 cursor-pointer"
                            >
                              <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setTeamDraft((prev) => prev.filter((_, i) => i !== idx))
                              }
                              aria-label="Remove team member"
                              className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-xl bg-[#E45B5B]/10 text-[#E45B5B] cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={2} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={member.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTeamDraft((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, name: val } : m))
                              );
                            }}
                            placeholder="Member name"
                            aria-label="Member name"
                            className="w-full min-h-[42px] rounded-xl bg-[var(--bg-card)] border border-[var(--divider)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
                          />
                          <input
                            type="text"
                            value={member.role}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTeamDraft((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, role: val } : m))
                              );
                            }}
                            placeholder="Role / Title"
                            aria-label="Member role"
                            className="w-full min-h-[42px] rounded-xl bg-[var(--bg-card)] border border-[var(--divider)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
                          />
                        </div>

                        <input
                          type="url"
                          value={member.image.startsWith('data:') ? '' : member.image}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTeamDraft((prev) =>
                              prev.map((m, i) => (i === idx ? { ...m, image: val } : m))
                            );
                          }}
                          placeholder="Photo URL (optional)"
                          aria-label="Member photo URL"
                          className="w-full min-h-[42px] rounded-xl bg-[var(--bg-card)] border border-[var(--divider)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={aboutSaving}
                className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] disabled:opacity-60 transition-opacity hover:opacity-90 cursor-pointer"
              >
                {aboutSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save About App
              </button>
            </form>
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
