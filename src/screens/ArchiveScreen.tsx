import React, { useState } from 'react';
import { Archive, ChevronLeft } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NavigationShell } from '../components/NavigationShell';
import { NoteCard } from '../components/NoteCard';
import { useNotes } from '../context/NotesContext';

export function ArchiveScreen() {
  const {
    archivedNotes,
    getFolderById,
    restoreArchivedNote,
    permanentlyDeleteNote,
    navigate,
    goBack,
  } = useNotes();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  return (
    <NavigationShell showMobileTabs>
      <header className="sticky top-0 z-20 bg-[#F8F7F5]/95 dark:bg-[#171717]/95 backdrop-blur-md px-4 sm:px-8 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#202124] dark:text-[#F4F4F2] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202124] dark:text-[#F4F4F2]">
            Archived Notes
          </h1>
        </div>
        <p className="mt-1 text-xs text-[#858585] dark:text-[#9A9A96] pl-12 lg:pl-0 tabular-nums">
          {archivedNotes.length} {archivedNotes.length === 1 ? 'archived note' : 'archived notes'}
        </p>
      </header>

      <section className="px-5 sm:px-8 pt-3">
        {archivedNotes.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] text-[#858585]">
              <Archive className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <h2 className="mt-4 text-base font-semibold">No archived notes</h2>
            <p className="mt-1 text-sm text-[#858585] max-w-xs">
              Notes you archive stay safely stored here out of your main list.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {archivedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                folder={getFolderById(note.folderId)}
                onClick={() => navigate('note-details', { noteId: note.id })}
                onRestore={() => restoreArchivedNote(note.id)}
                onPermanentDelete={() => setDeleteId(note.id)}
              />
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Note Forever?"
        description="This action cannot be undone. The archived note will be permanently removed."
        confirmLabel="Delete Forever"
        onConfirm={() => {
          if (deleteId) permanentlyDeleteNote(deleteId);
        }}
        onClose={() => setDeleteId(null)}
      />
    </NavigationShell>
  );
}
