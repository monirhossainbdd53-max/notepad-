import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Archive,
  FileText,
  Layers,
  MoreHorizontal,
  Pin,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { NavigationShell } from '../components/NavigationShell';
import { NoteCard } from '../components/NoteCard';
import { useNotes } from '../context/NotesContext';

export function NotesHomeScreen() {
  const { activeNotes, folders, navigate, getFolderById, createNote } = useNotes();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState(false);
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

  const filterTabs = useMemo(() => {
    const preferredOrder = ['Personal', 'Work', 'Ideas'];
    const ordered = [...folders].sort((a, b) => {
      const ia = preferredOrder.indexOf(a.name);
      const ib = preferredOrder.indexOf(b.name);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
    return [{ id: 'all', name: 'All' }, ...ordered.slice(0, 5)];
  }, [folders]);

  const filteredNotes = useMemo(() => {
    if (selectedFilter === 'all') return activeNotes;
    return activeNotes.filter((n) => n.folderId === selectedFilter);
  }, [activeNotes, selectedFilter]);

  const handleQuickCreate = () => {
    const folderId = selectedFilter !== 'all' ? selectedFilter : undefined;
    const note = createNote(folderId ? { folderId } : undefined);
    navigate('create-note', { noteId: note.id });
  };

  return (
    <NavigationShell showMobileTabs showFab fabFolderId={selectedFilter !== 'all' ? selectedFilter : undefined}>
      {/* Sticky Minimal Header */}
      <header className="sticky top-0 z-20 bg-[#F8F7F5]/95 dark:bg-[#171717]/95 backdrop-blur-md px-5 sm:px-8 pt-5 pb-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202124] dark:text-[#F4F4F2]">
            Notes
          </h1>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate('search')}
              aria-label="Search notes"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#202124] dark:text-[#F4F4F2] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] transition-colors cursor-pointer"
            >
              <Search className="h-5 w-5" strokeWidth={1.85} />
            </button>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="More options"
                aria-expanded={menuOpen}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#202124] dark:text-[#F4F4F2] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] transition-colors cursor-pointer"
              >
                <MoreHorizontal className="h-5 w-5" strokeWidth={1.85} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] py-1.5 z-40">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('all-notes');
                    }}
                    className="flex w-full min-h-[42px] items-center gap-2.5 px-4 text-sm text-[#202124] dark:text-[#F4F4F2] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
                  >
                    <Layers className="h-4 w-4 text-[#858585]" strokeWidth={1.8} />
                    All Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('pinned-notes');
                    }}
                    className="flex w-full min-h-[42px] items-center gap-2.5 px-4 text-sm text-[#202124] dark:text-[#F4F4F2] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
                  >
                    <Pin className="h-4 w-4 text-[#D9A928]" strokeWidth={1.8} />
                    Pinned Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('archive');
                    }}
                    className="flex w-full min-h-[42px] items-center gap-2.5 px-4 text-sm text-[#202124] dark:text-[#F4F4F2] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
                  >
                    <Archive className="h-4 w-4 text-[#858585]" strokeWidth={1.8} />
                    Archived Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('trash');
                    }}
                    className="flex w-full min-h-[42px] items-center gap-2.5 px-4 text-sm text-[#E45B5B] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.8} />
                    Trash
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Folder Filter Tabs */}
        <div
          className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
          role="tablist"
          aria-label="Filter notes by folder"
        >
          {filterTabs.map((tab) => {
            const active = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedFilter(tab.id)}
                className={`min-h-[36px] px-4 rounded-full text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#202124] text-white dark:bg-[#D9A928] dark:text-[#171717]'
                    : 'bg-white dark:bg-[#222222] text-[#858585] dark:text-[#9A9A96] border border-[#EEEEEC] dark:border-[#2E2E2B] hover:text-[#202124] dark:hover:text-[#F4F4F2]'
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>
      </header>

      {/* Notes Feed */}
      <section className="px-5 sm:px-8 pt-3">
        {filteredNotes.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] text-[#858585]">
              <FileText className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <h2 className="mt-4 text-base font-semibold text-[#202124] dark:text-[#F4F4F2]">
              No notes here yet
            </h2>
            <p className="mt-1 text-sm text-[#858585] dark:text-[#9A9A96] max-w-xs">
              Tap the button below to capture a new note in this view.
            </p>
            <button
              type="button"
              onClick={handleQuickCreate}
              className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#202124] dark:bg-[#D9A928] px-5 text-sm font-semibold text-white dark:text-[#171717] cursor-pointer"
            >
              <Plus className="h-4 w-4" strokeWidth={2.2} />
              New Note
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredNotes.map((note) => (
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
