import React, { useState } from 'react';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { NavigationShell } from '../components/NavigationShell';
import { NoteCard } from '../components/NoteCard';
import { useNotes } from '../context/NotesContext';

export function TrashScreen() {
  const {
    trashedNotes,
    getFolderById,
    restoreDeletedNote,
    permanentlyDeleteNote,
    emptyTrash,
    goBack,
  } = useNotes();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [emptyOpen, setEmptyOpen] = useState(false);

  return (
    <NavigationShell showMobileTabs>
      <header className="sticky top-0 z-20 bg-[var(--bg-canvas)]/95 backdrop-blur-md px-4 sm:px-8 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goBack}
              aria-label="Back"
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Trash
            </h1>
          </div>

          {trashedNotes.length > 0 && (
            <button
              type="button"
              onClick={() => setEmptyOpen(true)}
              className="min-h-[38px] px-3.5 rounded-full text-xs font-semibold text-[#E45B5B] bg-[#E45B5B]/10 hover:bg-[#E45B5B]/15 transition-colors cursor-pointer"
            >
              Empty Trash
            </button>
          )}
        </div>

        <p className="mt-1 text-xs text-[var(--text-secondary)] pl-12 lg:pl-0 tabular-nums">
          {trashedNotes.length} {trashedNotes.length === 1 ? 'deleted note' : 'deleted notes'}
        </p>
      </header>

      <section className="px-5 sm:px-8 pt-3">
        {trashedNotes.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] text-[var(--text-secondary)]">
              <Trash2 className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <h2 className="mt-4 text-base font-semibold">Trash is empty</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-xs">
              Deleted notes appear here so you can restore them anytime.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {trashedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                folder={getFolderById(note.folderId)}
                onClick={() => restoreDeletedNote(note.id)}
                onRestore={() => restoreDeletedNote(note.id)}
                onPermanentDelete={() => setDeleteId(note.id)}
              />
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Note?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) permanentlyDeleteNote(deleteId);
        }}
        onClose={() => setDeleteId(null)}
      />

      <ConfirmDialog
        open={emptyOpen}
        title="Empty Trash?"
        description={`All ${trashedNotes.length} notes in Trash will be permanently deleted. This action cannot be undone.`}
        confirmLabel="Empty Trash"
        onConfirm={emptyTrash}
        onClose={() => setEmptyOpen(false)}
      />
    </NavigationShell>
  );
}
