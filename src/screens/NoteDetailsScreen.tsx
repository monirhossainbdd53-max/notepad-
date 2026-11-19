import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ChevronLeft,
  Copy,
  Edit3,
  FolderInput,
  Lock,
  MoreHorizontal,
  Pin,
  Printer,
  Search,
  Share2,
  Star,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import { ConfirmDialog, FolderPickerDialog, InfoSheetDialog } from '../components/ConfirmDialog';
import { NavigationShell } from '../components/NavigationShell';
import { PinDialog } from '../components/PinDialog';
import { useBackHandler, useNotes } from '../context/NotesContext';
import {
  countWords,
  extractNoteImages,
  formatFullDate,
  stripHtmlToText,
  toggleChecklistItemInHtml,
} from '../utils/noteHelpers';

function highlightSearchMatches(html: string, query: string): { html: string; count: number } {
  const q = query.trim();
  if (!q || typeof window === 'undefined') return { html, count: 0 };

  const container = document.createElement('div');
  container.innerHTML = html;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'gi');
  let count = 0;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let current: Node | null = walker.nextNode();
  while (current) {
    const parentEl = current.parentElement;
    if (
      parentEl &&
      !parentEl.closest('.note-image-controls') &&
      current.nodeValue &&
      regex.test(current.nodeValue)
    ) {
      textNodes.push(current as Text);
    }
    regex.lastIndex = 0;
    current = walker.nextNode();
  }

  textNodes.forEach((node) => {
    const val = node.nodeValue || '';
    regex.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    let match: RegExpExecArray | null = regex.exec(val);
    while (match) {
      if (match.index > lastIdx) {
        frag.appendChild(document.createTextNode(val.slice(lastIdx, match.index)));
      }
      const mark = document.createElement('mark');
      mark.className = 'find-match';
      mark.textContent = match[0];
      frag.appendChild(mark);
      count += 1;
      lastIdx = match.index + match[0].length;
      match = regex.exec(val);
    }
    if (lastIdx < val.length) {
      frag.appendChild(document.createTextNode(val.slice(lastIdx)));
    }
    node.parentNode?.replaceChild(frag, node);
  });

  return { html: container.innerHTML, count };
}

export function NoteDetailsScreen() {
  const {
    activeNoteId,
    getNoteById,
    getFolderById,
    folders,
    updateNote,
    togglePinNote,
    toggleFavoriteNote,
    toggleLockNote,
    notePin,
    setNotePin,
    unlockedNoteIds,
    unlockNoteSession,
    lockNoteSession,
    isPremium,
    requestUpgrade,
    moveNoteToFolder,
    archiveNote,
    deleteNote,
    goBack,
    navigate,
    showToast,
  } = useNotes();

  const note = activeNoteId ? getNoteById(activeNoteId) : undefined;
  const [menuOpen, setMenuOpen] = useState(false);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [pinVerifyOpen, setPinVerifyOpen] = useState(false);
  const [pinCreateOpen, setPinCreateOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useBackHandler(menuOpen, () => setMenuOpen(false));
  useBackHandler(findOpen, () => {
    setFindOpen(false);
    setFindQuery('');
  });
  useBackHandler(Boolean(lightboxSrc), () => setLightboxSrc(null));

  const highlightedResult = useMemo(() => {
    if (!note || !findOpen || !findQuery.trim()) {
      return { html: note?.content || '', count: 0 };
    }
    return highlightSearchMatches(note.content, findQuery);
  }, [findOpen, findQuery, note]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [menuOpen]);

  if (!note) {
    return (
      <NavigationShell showMobileTabs={false}>
        <div className="p-8 text-center">
          <p className="text-sm text-[var(--text-secondary)]">Note not found.</p>
          <button
            type="button"
            onClick={() => navigate('home')}
            className="mt-4 min-h-[44px] rounded-full bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] px-5 text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] cursor-pointer"
          >
            Back to Notes
          </button>
        </div>
      </NavigationShell>
    );
  }

  const requiresPinUnlock = Boolean(note.isLocked && notePin && !unlockedNoteIds.includes(note.id));

  if (requiresPinUnlock) {
    return (
      <NavigationShell showMobileTabs={false}>
        <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)]">
          <header className="sticky top-0 z-30 flex h-[57px] items-center bg-[var(--bg-canvas)]/95 border-b border-[var(--divider)] px-3 sm:px-6">
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-primary)]">
              <Lock className="h-7 w-7" strokeWidth={1.85} />
            </div>
            <h1 className="mt-5 text-xl font-bold text-[var(--text-primary)]">
              {note.title.trim() || 'Locked Note'}
            </h1>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)] max-w-xs">
              This note is protected. Enter your 4-digit PIN to read or edit its contents.
            </p>
            <button
              type="button"
              onClick={() => setPinVerifyOpen(true)}
              className="mt-6 min-h-[46px] rounded-full bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] px-6 text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] cursor-pointer"
            >
              Unlock Note
            </button>
          </div>

          <PinDialog
            open={pinVerifyOpen}
            mode="verify"
            expectedPin={notePin}
            onSuccess={() => unlockNoteSession(note.id)}
            onClose={() => setPinVerifyOpen(false)}
          />
        </div>
      </NavigationShell>
    );
  }

  const folder = getFolderById(note.folderId);
  const words = countWords(note.content);
  const legacyImages = note.images ?? [];

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const box = target.closest('.note-check-box');
    if (box) {
      const container = e.currentTarget;
      const boxes = Array.from(container.querySelectorAll('.note-check-box'));
      const index = boxes.indexOf(box);
      if (index !== -1) {
        const updatedHtml = toggleChecklistItemInHtml(note.content, index);
        updateNote(note.id, { content: updatedHtml });
      }
      return;
    }

    const clickedImg = target.closest('.note-image-block img') as HTMLImageElement | null;
    if (clickedImg && clickedImg.src) {
      setLightboxSrc(clickedImg.src);
    }
  };

  const handleToggleLock = () => {
    setMenuOpen(false);
    if (!isPremium) {
      requestUpgrade('Secure Note Lock with 4-digit PIN is a Notes Premium feature.');
      return;
    }
    if (!notePin) {
      setPinCreateOpen(true);
      return;
    }
    toggleLockNote(note.id);
  };

  const handleCopyNote = async () => {
    const plain = `${note.title || 'Untitled Note'}\n\n${stripHtmlToText(note.content)}`;
    try {
      await navigator.clipboard.writeText(plain);
      showToast('Copied to clipboard');
      setShareOpen(false);
    } catch {
      showToast('Copy unavailable in this browser');
    }
  };

  return (
    <NavigationShell showMobileTabs={false}>
      <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[57px] items-center justify-between bg-[var(--bg-canvas)]/95 backdrop-blur-md border-b border-[var(--divider)] px-3 sm:px-6">
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>

          <div className="flex items-center gap-1">
            {note.isLocked && (
              <button
                type="button"
                onClick={() => {
                  lockNoteSession(note.id);
                  showToast('Note locked');
                }}
                aria-label="Lock note now"
                title="Lock note now"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--accent-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
              >
                <Lock className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </button>
            )}

            <button
              type="button"
              onClick={() => togglePinNote(note.id)}
              aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                note.isPinned
                  ? 'text-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Pin
                className={`h-[18px] w-[18px] ${
                  note.isPinned ? 'fill-[var(--accent-primary)]' : ''
                }`}
                strokeWidth={1.9}
              />
            </button>

            <button
              type="button"
              onClick={() => toggleFavoriteNote(note.id)}
              aria-label={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                note.isFavorite
                  ? 'text-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Star
                className={`h-[18px] w-[18px] ${
                  note.isFavorite ? 'fill-[var(--accent-primary)]' : ''
                }`}
                strokeWidth={1.9}
              />
            </button>

            <button
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label="Share note"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <Share2 className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="More options"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
              >
                <MoreHorizontal className="h-5 w-5" strokeWidth={1.9} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] py-1.5 z-40">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('edit-note', { noteId: note.id });
                    }}
                    className="flex w-full min-h-[42px] items-center gap-2.5 px-4 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                  >
                    <Edit3 className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.8} />
                    Edit Note
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setFindOpen(true);
                    }}
                    className="flex w-full min-h-[42px] items-center gap-2.5 px-4 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                  >
                    <Search className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.8} />
                    Find in Note
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleLock}
                    className="flex w-full min-h-[42px] items-center justify-between px-4 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      {note.isLocked ? (
                        <Unlock className="h-4 w-4 text-[var(--accent-primary)]" strokeWidth={1.8} />
                      ) : (
                        <Lock className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.8} />
                      )}
                      {note.isLocked ? 'Remove Lock' : 'Lock Note'}
                    </span>
                    {!isPremium && (
                      <Lock className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setFolderPickerOpen(true);
                    }}
                    className="flex w-full min-h-[42px] items-center gap-2.5 px-4 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                  >
                    <FolderInput className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.8} />
                    Move to Folder
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      archiveNote(note.id);
                      navigate('home');
                    }}
                    className="flex w-full min-h-[42px] items-center gap-2.5 px-4 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                  >
                    <Archive className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.8} />
                    Archive Note
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteOpen(true);
                    }}
                    className="flex w-full min-h-[42px] items-center gap-2.5 px-4 text-sm text-[#E45B5B] hover:bg-[var(--bg-subtle)] cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                    Delete Note
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Compact Find in Note Bar */}
        {findOpen && (
          <div className="print-hide border-b border-[var(--divider)] bg-[var(--bg-card)] px-4 sm:px-8 py-2.5">
            <div className="max-w-3xl mx-auto flex items-center gap-2">
              <Search className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
              <input
                type="text"
                autoFocus
                value={findQuery}
                onChange={(e) => setFindQuery(e.target.value)}
                placeholder="Find in this note..."
                aria-label="Find in this note"
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none"
              />
              {findQuery.trim() && (
                <span className="text-xs text-[var(--text-secondary)] tabular-nums shrink-0">
                  {highlightedResult.count} {highlightedResult.count === 1 ? 'match' : 'matches'}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setFindOpen(false);
                  setFindQuery('');
                }}
                aria-label="Close find"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Note Content */}
        <article className="flex-1 px-5 sm:px-8 pt-7 pb-24 max-w-3xl w-full mx-auto">
          <h1 className="text-2xl sm:text-[30px] font-bold tracking-tight text-[var(--text-primary)] leading-tight text-balance">
            {note.title.trim() || 'Untitled Note'}
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)] tabular-nums">
            <span>{formatFullDate(note.updatedAt)}</span>
            {folder && (
              <>
                <span aria-hidden="true">·</span>
                <span>{folder.name}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{words} {words === 1 ? 'word' : 'words'}</span>
          </div>

          <div className="my-5 h-px bg-[var(--divider)]" />

          <div
            onClick={handleContentClick}
            className="note-content note-readonly text-[var(--text-primary)]"
            dangerouslySetInnerHTML={{
              __html:
                highlightedResult.html ||
                (extractNoteImages(note.content, legacyImages).length > 0
                  ? ''
                  : '<p style="color:var(--text-secondary);">This note is empty. Tap Edit to start writing.</p>'),
            }}
          />

          {legacyImages.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {legacyImages.map((src, idx) => (
                <button
                  key={`${idx}_${src.slice(0, 28)}`}
                  type="button"
                  onClick={() => setLightboxSrc(src)}
                  className="overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] text-left cursor-pointer hover:border-[var(--accent-primary)]/70 transition-colors"
                >
                  <img
                    src={src}
                    alt={`${note.title || 'Note'} attachment ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full max-h-80 object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </article>

        {/* Floating Edit Action Button */}
        <button
          type="button"
          onClick={() => navigate('edit-note', { noteId: note.id })}
          aria-label="Edit note"
          className="fixed right-5 bottom-6 lg:right-10 lg:bottom-8 z-30 flex h-13 w-13 items-center justify-center rounded-full bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] text-[var(--bg-card)] dark:text-[#171717] transition-transform active:scale-95 cursor-pointer"
        >
          <Edit3 className="h-5 w-5" strokeWidth={2} />
        </button>

        {lightboxSrc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
            onClick={() => setLightboxSrc(null)}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setLightboxSrc(null)}
              aria-label="Close preview"
              className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxSrc}
              alt="Full preview"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
              className="max-h-[88vh] max-w-full rounded-2xl object-contain"
            />
          </div>
        )}

        <FolderPickerDialog
          open={folderPickerOpen}
          folders={folders}
          selectedFolderId={note.folderId}
          onSelect={(fid) => moveNoteToFolder(note.id, fid)}
          onClose={() => setFolderPickerOpen(false)}
        />

        <InfoSheetDialog
          open={shareOpen}
          title="Share Note"
          onClose={() => setShareOpen(false)}
        >
          <div className="space-y-4">
            <div className="rounded-2xl bg-[var(--bg-canvas)] border border-[var(--divider)] p-4">
              <p className="font-semibold text-[var(--text-primary)]">
                {note.title || 'Untitled Note'}
              </p>
              <p className="mt-1.5 text-xs text-[var(--text-secondary)] line-clamp-4">
                {stripHtmlToText(note.content) || 'No content'}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleCopyNote}
                className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] cursor-pointer"
              >
                <Copy className="h-4 w-4" strokeWidth={2} />
                Copy Plain Text
              </button>

              <button
                type="button"
                onClick={() => {
                  setShareOpen(false);
                  window.setTimeout(() => window.print(), 120);
                }}
                className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[var(--bg-subtle)] text-sm font-semibold text-[var(--text-primary)] cursor-pointer"
              >
                <Printer className="h-4 w-4" strokeWidth={2} />
                Print / Save as PDF
              </button>
            </div>
          </div>
        </InfoSheetDialog>

        <ConfirmDialog
          open={deleteOpen}
          title="Delete Note?"
          description="This note will be moved to Trash where you can restore or permanently delete it."
          confirmLabel="Move to Trash"
          onConfirm={() => {
            deleteNote(note.id);
            navigate('home');
          }}
          onClose={() => setDeleteOpen(false)}
        />

        <PinDialog
          open={pinCreateOpen}
          mode="create"
          onSuccess={(newPin) => {
            setNotePin(newPin);
            toggleLockNote(note.id);
          }}
          onClose={() => setPinCreateOpen(false)}
        />
      </div>
    </NavigationShell>
  );
}
