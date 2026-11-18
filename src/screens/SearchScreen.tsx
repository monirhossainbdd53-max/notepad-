import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Folder as FolderIcon, Search, X } from 'lucide-react';
import { NavigationShell } from '../components/NavigationShell';
import { NoteCard } from '../components/NoteCard';
import { useNotes } from '../context/NotesContext';
import { stripHtmlToText } from '../utils/noteHelpers';

export function SearchScreen() {
  const {
    activeNotes,
    folders,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    getFolderById,
    getFolderNoteCount,
    navigate,
    goBack,
  } = useNotes();

  const [query, setQuery] = useState('');

  const normalized = query.trim().toLowerCase();

  const matchingFolders = useMemo(() => {
    if (!normalized) return [];
    return folders.filter((f) => f.name.toLowerCase().includes(normalized));
  }, [folders, normalized]);

  const matchingNotes = useMemo(() => {
    if (!normalized) return [];
    return activeNotes.filter((n) => {
      const titleMatch = n.title.toLowerCase().includes(normalized);
      const bodyMatch = stripHtmlToText(n.content).toLowerCase().includes(normalized);
      return titleMatch || bodyMatch;
    });
  }, [activeNotes, normalized]);

  const handleOpenNote = (noteId: string) => {
    if (query.trim()) addRecentSearch(query.trim());
    navigate('note-details', { noteId });
  };

  const handleOpenFolder = (folderId: string) => {
    if (query.trim()) addRecentSearch(query.trim());
    navigate('folder-details', { folderId });
  };

  return (
    <NavigationShell showMobileTabs={false}>
      <header className="sticky top-0 z-20 bg-[#F8F7F5]/95 dark:bg-[#171717]/95 backdrop-blur-md px-4 sm:px-8 pt-4 pb-3 border-b border-[#EEEEEC] dark:border-[#2E2E2B]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#202124] dark:text-[#F4F4F2] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] shrink-0 cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>

          <div className="relative flex-1 flex items-center">
            <Search
              className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#858585]"
              strokeWidth={1.9}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  addRecentSearch(query.trim());
                }
              }}
              placeholder="Search notes or folders..."
              aria-label="Search notes or folders"
              autoFocus
              className="w-full min-h-[44px] rounded-full bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] pl-10 pr-10 text-sm text-[#202124] dark:text-[#F4F4F2] placeholder:text-[#858585] focus:outline-none focus:border-[#D9A928]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-1.5 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full text-[#858585] hover:text-[#202124] dark:hover:text-[#F4F4F2] cursor-pointer"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="px-5 sm:px-8 pt-6 space-y-6">
        {!normalized ? (
          <div>
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-[#858585] dark:text-[#9A9A96]">
                    Recent Searches
                  </h2>
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="text-xs font-medium text-[#858585] hover:text-[#202124] dark:hover:text-[#F4F4F2] cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="min-h-[36px] rounded-full bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] px-3.5 text-xs font-medium text-[#202124] dark:text-[#F4F4F2] hover:border-[#D9A928] transition-colors cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-xs font-semibold text-[#858585] dark:text-[#9A9A96] mb-3">
                Quick Suggestions
              </h2>
              <div className="rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] divide-y divide-[#EEEEEC] dark:divide-[#2E2E2B]">
                {activeNotes.slice(0, 4).map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => navigate('note-details', { noteId: note.id })}
                    className="flex w-full min-h-[48px] items-center gap-3 px-4 text-left text-sm text-[#202124] dark:text-[#F4F4F2] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] transition-colors cursor-pointer"
                  >
                    <Search className="h-4 w-4 shrink-0 text-[#858585]" strokeWidth={1.75} />
                    <span className="truncate">{note.title || 'Untitled Note'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : matchingFolders.length === 0 && matchingNotes.length === 0 ? (
          <div className="mt-16 flex flex-col items-center text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] text-[#858585]">
              <Search className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <h2 className="mt-4 text-base font-semibold">No matching results</h2>
            <p className="mt-1 text-sm text-[#858585] max-w-xs">
              Try searching with a different keyword or folder name.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {matchingFolders.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-[#858585] dark:text-[#9A9A96] mb-2.5">
                  Folders
                </h2>
                <div className="rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] divide-y divide-[#EEEEEC] dark:divide-[#2E2E2B]">
                  {matchingFolders.map((folder) => (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => handleOpenFolder(folder.id)}
                      className="flex w-full min-h-[52px] items-center justify-between px-4 text-left hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-3 text-sm font-medium">
                        <FolderIcon className="h-4 w-4 text-[#D9A928]" strokeWidth={1.85} />
                        {folder.name}
                      </span>
                      <span className="flex items-center gap-2 text-xs text-[#858585] tabular-nums">
                        {getFolderNoteCount(folder.id)}
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {matchingNotes.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-[#858585] dark:text-[#9A9A96] mb-2.5 tabular-nums">
                  Notes ({matchingNotes.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {matchingNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      folder={getFolderById(note.folderId)}
                      onClick={() => handleOpenNote(note.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </NavigationShell>
  );
}
