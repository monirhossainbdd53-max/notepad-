import React, { useEffect, useRef, useState } from 'react';
import {
  Archive,
  Check,
  ChevronLeft,
  FolderInput,
  MoreHorizontal,
  Pin,
  Star,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog, FolderPickerDialog } from '../components/ConfirmDialog';
import { NavigationShell } from '../components/NavigationShell';
import { RichTextEditor } from '../components/RichTextEditor';
import { useNotes } from '../context/NotesContext';

interface NoteEditorScreenProps {
  mode: 'create' | 'edit';
}

export function NoteEditorScreen({ mode }: NoteEditorScreenProps) {
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
    permanentlyDeleteNote,
  } = useNotes();

  const note = activeNoteId ? getNoteById(activeNoteId) : undefined;

  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [images, setImages] = useState<string[]>(note?.images ?? []);
  const [saveState, setSaveState] = useState<'saved' | 'saving'>('saved');
  const [menuOpen, setMenuOpen] = useState(false);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setImages(note.images ?? []);
    }
  }, [note?.id]);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [menuOpen]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

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

  const scheduleAutoSave = (nextTitle: string, nextContent: string, nextImages: string[]) => {
    setSaveState('saving');
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      updateNote(note.id, { title: nextTitle, content: nextContent, images: nextImages });
      setSaveState('saved');
    }, 280);
  };

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    scheduleAutoSave(nextTitle, content, images);
  };

  const handleContentChange = (nextContent: string) => {
    setContent(nextContent);
    scheduleAutoSave(title, nextContent, images);
  };

  const handleImagesChange = (nextImages: string[]) => {
    setImages(nextImages);
    scheduleAutoSave(title, content, nextImages);
  };

  const handleBackOrDone = () => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    const emptyTitle = !title.trim();
    const emptyContent = !content.replace(/<[^>]*>/g, '').trim();
    const emptyImages = images.length === 0;

    if (mode === 'create' && emptyTitle && emptyContent && emptyImages) {
      permanentlyDeleteNote(note.id);
      goBack();
      return;
    }

    updateNote(note.id, { title, content, images });
    setSaveState('saved');
    goBack();
  };

  const folder = getFolderById(note.folderId);

  return (
    <NavigationShell showMobileTabs={false}>
      <div className="min-h-screen flex flex-col bg-[#F8F7F5] dark:bg-[#171717]">
        {/* Top Editor Header */}
        <header className="sticky top-0 z-30 flex h-[57px] items-center justify-between bg-[#F8F7F5]/95 dark:bg-[#171717]/95 backdrop-blur-md border-b border-[#EEEEEC] dark:border-[#2E2E2B] px-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackOrDone}
              aria-label="Back"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#202124] dark:text-[#F4F4F2] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>

            <span className="text-xs text-[#858585] dark:text-[#9A9A96] flex items-center gap-1.5">
              {saveState === 'saving' ? (
                <span>Saving…</span>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 text-[#D9A928]" strokeWidth={2.2} />
                  <span>Saved</span>
                </>
              )}
              {folder && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="hidden sm:inline">{folder.name}</span>
                </>
              )}
            </span>
          </div>

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

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="More note options"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#202124] dark:text-[#F4F4F2] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] cursor-pointer"
              >
                <MoreHorizontal className="h-5 w-5" strokeWidth={1.9} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] py-1.5 z-40">
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
                      setDeleteConfirmOpen(true);
                    }}
                    className="flex w-full min-h-[42px] items-center gap-2.5 px-4 text-sm text-[#E45B5B] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                    Delete Note
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleBackOrDone}
              className="ml-1 min-h-[36px] px-3.5 rounded-full bg-[#202124] dark:bg-[#D9A928] text-xs font-semibold text-white dark:text-[#171717] cursor-pointer"
            >
              Done
            </button>
          </div>
        </header>

        <RichTextEditor
          title={title}
          content={content}
          images={images}
          onChangeTitle={handleTitleChange}
          onChangeContent={handleContentChange}
          onChangeImages={handleImagesChange}
          autoFocusBody={mode === 'create'}
        />

        <FolderPickerDialog
          open={folderPickerOpen}
          folders={folders}
          selectedFolderId={note.folderId}
          onSelect={(fid) => moveNoteToFolder(note.id, fid)}
          onClose={() => setFolderPickerOpen(false)}
        />

        <ConfirmDialog
          open={deleteConfirmOpen}
          title="Move note to Trash?"
          description="You can restore this note later from the Trash screen."
          confirmLabel="Move to Trash"
          onConfirm={() => {
            deleteNote(note.id);
            navigate('home');
          }}
          onClose={() => setDeleteConfirmOpen(false)}
        />
      </div>
    </NavigationShell>
  );
}
