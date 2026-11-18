import React, { useEffect, useRef, useState } from 'react';
import {
  Archive,
  ChevronLeft,
  Copy,
  Edit3,
  FolderInput,
  MoreHorizontal,
  Pin,
  Share2,
  Star,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog, FolderPickerDialog, InfoSheetDialog } from '../components/ConfirmDialog';
import { NavigationShell } from '../components/NavigationShell';
import { useNotes } from '../context/NotesContext';
import {
  countWords,
  formatFullDate,
  stripHtmlToText,
  toggleChecklistItemInHtml,
} from '../utils/noteHelpers';

export function NoteDetailsScreen() {
  const {
    activeNoteId,
    getNoteById,
    getFolderById,
    folders,
    updateNote,
    togglePinNote,
    toggleFavoriteNote,
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
  const menuRef = useRef<HTMLDivElement>(null);

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
          <p className="text-sm text-[#858585]">Note not found.</p>
          <button
            type="button"
            onClick={() => navigate('home')}
            className="mt-4 min-h-[44px] rounded-full bg-[#202124] dark:bg-[#D9A928] px-5 text-sm font-semibold text-white dark:text-[#171717] cursor-pointer"
          >
            Back to Notes
          </button>
        </div>
      </NavigationShell>
    );
  }

  const folder = getFolderById(note.folderId);
  const words = countWords(note.content);

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const box = target.closest('.note-check-box');
    if (!box) return;
    const container = e.currentTarget;
    const boxes = Array.from(container.querySelectorAll('.note-check-box'));
    const index = boxes.indexOf(box);
    if (index !== -1) {
      const updatedHtml = toggleChecklistItemInHtml(note.content, index);
      updateNote(note.id, { content: updatedHtml });
    }
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
      <div className="min-h-screen flex flex-col bg-[#F8F7F5] dark:bg-[#171717]">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[57px] items-center justify-between bg-[#F8F7F5]/95 dark:bg-[#171717]/95 backdrop-blur-md border-b border-[#EEEEEC] dark:border-[#2E2E2B] px-3 sm:px-6">
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#202124] dark:text-[#F4F4F2] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => togglePinNote(note.id)}
              aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                note.isPinned
                  ? 'text-[#D9A928]'
                  : 'text-[#858585] hover:text-[#202124] dark:hover:text-[#F4F4F2]'
              }`}
            >
              <Pin
                className={`h-[18px] w-[18px] ${note.isPinned ? 'fill-[#D9A928]' : ''}`}
                strokeWidth={1.9}
              />
            </button>

            <button
              type="button"
              onClick={() => toggleFavoriteNote(note.id)}
              aria-label={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                note.isFavorite
                  ? 'text-[#D9A928]'
                  : 'text-[#858585] hover:text-[#202124] dark:hover:text-[#F4F4F2]'
              }`}
            >
              <Star
                className={`h-[18px] w-[18px] ${note.isFavorite ? 'fill-[#D9A928]' : ''}`}
                strokeWidth={1.9}
              />
            </button>

            <button
              type="button"
              onClick={() => setShareOpen(true)}
              aria-label="Share note"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#858585] hover:text-[#202124] dark:hover:text-[#F4F4F2] cursor-pointer"
            >
              <Share2 className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="More options"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#202124] dark:text-[#F4F4F2] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] cursor-pointer"
              >
                <MoreHorizontal className="h-5 w-5" strokeWidth={1.9} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] py-1.5 z-40">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('edit-note', { noteId: note.id });
                    }}
                    className="flex w-full min-h-[42px] items-center gap-2.5 px-4 text-sm text-[#202124] dark:text-[#F4F4F2] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
                  >
                    <Edit3 className="h-4 w-4 text-[#858585]" strokeWidth={1.8} />
                    Edit Note
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setFolderPickerOpen(true);
                    }}
                    className="flex w-full min-h-[42px] items-center gap-2.5 px-4 text-sm text-[#202124] dark:text-[#F4F4F2] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
                  >
                    <FolderInput className="h-4 w-4 text-[#858585]" strokeWidth={1.8} />
                    Move to Folder
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      archiveNote(note.id);
                      navigate('home');
                    }}
                    className="flex w-full min-h-[42px] items-center gap-2.5 px-4 text-sm text-[#202124] dark:text-[#F4F4F2] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
                  >
                    <Archive className="h-4 w-4 text-[#858585]" strokeWidth={1.8} />
                    Archive Note
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteOpen(true);
                    }}
                    className="flex w-full min-h-[42px] items-center gap-2.5 px-4 text-sm text-[#E45B5B] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                    Delete Note
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Note Content */}
        <article className="flex-1 px-5 sm:px-8 pt-7 pb-24 max-w-3xl w-full mx-auto">
          <h1 className="text-2xl sm:text-[30px] font-bold tracking-tight text-[#202124] dark:text-[#F4F4F2] leading-tight text-balance">
            {note.title.trim() || 'Untitled Note'}
          </h1>

          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-[#858585] dark:text-[#9A9A96] tabular-nums">
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

          <div className="my-5 h-px bg-[#EEEEEC] dark:bg-[#2E2E2B]" />

          <div
            onClick={handleContentClick}
            className="note-content text-[15.5px] sm:text-base text-[#202124] dark:text-[#F4F4F2]"
            dangerouslySetInnerHTML={{
              __html:
                note.content ||
                '<p style="color:#858585;">This note is empty. Tap Edit to start writing.</p>',
            }}
          />
        </article>

        {/* Floating Edit Action Button */}
        <button
          type="button"
          onClick={() => navigate('edit-note', { noteId: note.id })}
          aria-label="Edit note"
          className="fixed right-5 bottom-6 lg:right-10 lg:bottom-8 z-30 flex h-13 w-13 items-center justify-center rounded-full bg-[#202124] dark:bg-[#D9A928] text-white dark:text-[#171717] transition-transform active:scale-95 cursor-pointer"
        >
          <Edit3 className="h-5 w-5" strokeWidth={2} />
        </button>

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
            <div className="rounded-2xl bg-[#F8F7F5] dark:bg-[#171717] border border-[#EEEEEC] dark:border-[#2E2E2B] p-4">
              <p className="font-semibold text-[#202124] dark:text-[#F4F4F2]">
                {note.title || 'Untitled Note'}
              </p>
              <p className="mt-1.5 text-xs text-[#858585] dark:text-[#9A9A96] line-clamp-4">
                {stripHtmlToText(note.content) || 'No content'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyNote}
              className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#202124] dark:bg-[#D9A928] text-sm font-semibold text-white dark:text-[#171717] cursor-pointer"
            >
              <Copy className="h-4 w-4" strokeWidth={2} />
              Copy Plain Text
            </button>
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
      </div>
    </NavigationShell>
  );
}
