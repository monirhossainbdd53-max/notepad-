import React from 'react';
import {
  Archive,
  Crown,
  FileText,
  Folder,
  Layers,
  Pin,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { ScreenName } from '../types/notes';

interface NavigationShellProps {
  children: React.ReactNode;
  showMobileTabs?: boolean;
  showFab?: boolean;
  fabFolderId?: string;
}

export function NavigationShell({
  children,
  showMobileTabs = true,
  showFab = false,
  fabFolderId,
}: NavigationShellProps) {
  const {
    screen,
    navigate,
    activeNotes,
    pinnedNotes,
    favoriteNotes,
    archivedNotes,
    trashedNotes,
    folders,
    createNote,
  } = useNotes();

  const handleNewNote = () => {
    const note = createNote(fabFolderId ? { folderId: fabFolderId } : undefined);
    navigate('create-note', { noteId: note.id });
  };

  const primaryDesktopNav: {
    id: ScreenName;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    count?: number;
  }[] = [
    { id: 'home', label: 'Notes', icon: FileText, count: activeNotes.length },
    { id: 'all-notes', label: 'All Notes', icon: Layers, count: activeNotes.length },
    { id: 'pinned-notes', label: 'Pinned', icon: Pin, count: pinnedNotes.length },
    { id: 'favorites', label: 'Favorites', icon: Star, count: favoriteNotes.length },
    { id: 'folders', label: 'Folders', icon: Folder, count: folders.length },
    { id: 'archive', label: 'Archived', icon: Archive, count: archivedNotes.length },
    { id: 'trash', label: 'Trash', icon: Trash2, count: trashedNotes.length },
  ];

  const mobileTabs: {
    id: ScreenName;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }[] = [
    { id: 'home', label: 'Notes', icon: FileText },
    { id: 'folders', label: 'Folders', icon: Folder },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const isTabActive = (tabId: ScreenName) => {
    if (tabId === 'home') {
      return screen === 'home' || screen === 'all-notes' || screen === 'pinned-notes';
    }
    if (tabId === 'folders') {
      return screen === 'folders' || screen === 'folder-details';
    }
    if (tabId === 'settings') {
      return (
        screen === 'settings' ||
        screen === 'appearance' ||
        screen === 'account' ||
        screen === 'premium' ||
        screen === 'help' ||
        screen === 'about'
      );
    }
    return screen === tabId;
  };

  return (
    <div className="min-h-screen bg-[#F8F7F5] dark:bg-[#171717] text-[#202124] dark:text-[#F4F4F2] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-[#EEEEEC] dark:border-[#2E2E2B] bg-[#F8F7F5] dark:bg-[#171717] px-4 py-6">
        <div className="flex items-center justify-between px-2 mb-5">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="flex items-center gap-2.5 text-left cursor-pointer"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF5D9] dark:bg-[#D9A928]/20 text-[#D9A928]">
              <FileText className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <span className="text-lg font-bold tracking-tight text-[#202124] dark:text-[#F4F4F2]">
              Notes
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('search')}
            aria-label="Search notes"
            className={`min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
              screen === 'search'
                ? 'bg-[#FFF5D9] dark:bg-[#D9A928]/20 text-[#D9A928]'
                : 'text-[#858585] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222]'
            }`}
          >
            <Search className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleNewNote}
          className="mb-6 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-[#202124] dark:bg-[#D9A928] px-4 text-sm font-semibold text-white dark:text-[#171717] transition-opacity hover:opacity-90 cursor-pointer"
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          <span>New Note</span>
        </button>

        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar" aria-label="Primary navigation">
          {primaryDesktopNav.map((item) => {
            const Icon = item.icon;
            const active =
              screen === item.id ||
              (item.id === 'folders' && screen === 'folder-details');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`flex w-full min-h-[40px] items-center justify-between rounded-xl px-3 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#FFF5D9] dark:bg-[#D9A928]/16 text-[#202124] dark:text-[#F4F4F2]'
                    : 'text-[#858585] dark:text-[#9A9A96] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] hover:text-[#202124] dark:hover:text-[#F4F4F2]'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? 'text-[#D9A928]' : ''}`}
                    strokeWidth={active ? 2.1 : 1.75}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="text-xs text-[#858585] dark:text-[#9A9A96] tabular-nums">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="pt-4 mt-4 border-t border-[#EEEEEC] dark:border-[#2E2E2B] space-y-1">
          <button
            type="button"
            onClick={() => navigate('premium')}
            className={`flex w-full min-h-[40px] items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors cursor-pointer ${
              screen === 'premium'
                ? 'bg-[#FFF5D9] dark:bg-[#D9A928]/16 text-[#202124] dark:text-[#F4F4F2]'
                : 'text-[#858585] dark:text-[#9A9A96] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] hover:text-[#202124] dark:hover:text-[#F4F4F2]'
            }`}
          >
            <Crown className="h-4 w-4 text-[#D9A928]" strokeWidth={1.9} />
            <span>Premium</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('settings')}
            className={`flex w-full min-h-[40px] items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors cursor-pointer ${
              isTabActive('settings') && screen !== 'premium'
                ? 'bg-[#FFF5D9] dark:bg-[#D9A928]/16 text-[#202124] dark:text-[#F4F4F2]'
                : 'text-[#858585] dark:text-[#9A9A96] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] hover:text-[#202124] dark:hover:text-[#F4F4F2]'
            }`}
          >
            <Settings
              className={`h-4 w-4 ${
                isTabActive('settings') && screen !== 'premium' ? 'text-[#D9A928]' : ''
              }`}
              strokeWidth={1.8}
            />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 min-w-0">
        <div
          className={`mx-auto w-full max-w-4xl ${
            showMobileTabs ? 'pb-24 lg:pb-12' : 'pb-8'
          }`}
        >
          {children}
        </div>
      </main>

      {/* Floating + Action Button (Mobile & Tablet, or secondary trigger) */}
      {showFab && (
        <button
          type="button"
          onClick={handleNewNote}
          aria-label="Create new note"
          className={`fixed right-5 z-30 flex h-13 w-13 items-center justify-center rounded-full bg-[#202124] dark:bg-[#D9A928] text-white dark:text-[#171717] transition-transform active:scale-95 cursor-pointer lg:hidden ${
            showMobileTabs ? 'bottom-20' : 'bottom-6'
          }`}
        >
          <Plus className="h-6 w-6" strokeWidth={2.2} />
        </button>
      )}

      {/* Mobile Bottom Tab Navigation */}
      {showMobileTabs && (
        <nav
          aria-label="Bottom navigation"
          className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#EEEEEC] dark:border-[#2E2E2B] bg-white/95 dark:bg-[#222222]/95 backdrop-blur-md lg:hidden"
        >
          <div className="mx-auto grid max-w-lg grid-cols-4 h-16 items-center">
            {mobileTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isTabActive(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => navigate(tab.id)}
                  className="flex min-h-[44px] flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      active
                        ? 'text-[#D9A928]'
                        : 'text-[#858585] dark:text-[#9A9A96]'
                    }`}
                    strokeWidth={active ? 2.2 : 1.75}
                  />
                  <span
                    className={`text-[11px] font-medium whitespace-nowrap ${
                      active
                        ? 'text-[#202124] dark:text-[#F4F4F2]'
                        : 'text-[#858585] dark:text-[#9A9A96]'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
