import React from 'react';
import { Search, Star } from 'lucide-react';
import { NavigationShell } from '../components/NavigationShell';
import { NoteCard } from '../components/NoteCard';
import { useNotes } from '../context/NotesContext';

export function FavoriteNotesScreen() {
  const { favoriteNotes, getFolderById, navigate } = useNotes();

  return (
    <NavigationShell showMobileTabs showFab>
      <header className="sticky top-0 z-20 bg-[#F8F7F5]/95 dark:bg-[#171717]/95 backdrop-blur-md px-5 sm:px-8 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202124] dark:text-[#F4F4F2]">
            Favorites
          </h1>

          <button
            type="button"
            onClick={() => navigate('search')}
            aria-label="Search notes"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#202124] dark:text-[#F4F4F2] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] cursor-pointer"
          >
            <Search className="h-5 w-5" strokeWidth={1.85} />
          </button>
        </div>

        <p className="mt-1.5 text-xs text-[#858585] dark:text-[#9A9A96] tabular-nums">
          {favoriteNotes.length} {favoriteNotes.length === 1 ? 'favorite note' : 'favorite notes'}
        </p>
      </header>

      <section className="px-5 sm:px-8 pt-3">
        {favoriteNotes.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] text-[#D9A928]">
              <Star className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <h2 className="mt-4 text-base font-semibold">No favorites yet</h2>
            <p className="mt-1 text-sm text-[#858585] max-w-xs">
              Tap the star icon on any note to keep it in your favorites.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {favoriteNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                folder={getFolderById(note.folderId)}
                onClick={() => navigate('note-details', { noteId: note.id })}
              />
            ))}
          </div>
        )}
      </section>
    </NavigationShell>
  );
}
