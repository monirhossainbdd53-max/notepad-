import React, { useState } from 'react';
import {
  Archive,
  ChevronRight,
  Edit2,
  Folder as FolderIcon,
  FolderPlus,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog, FolderNameDialog } from '../components/ConfirmDialog';
import { NavigationShell } from '../components/NavigationShell';
import { useNotes } from '../context/NotesContext';
import { Folder } from '../types/notes';

export function FoldersScreen() {
  const {
    folders,
    archivedNotes,
    trashedNotes,
    getFolderNoteCount,
    createFolder,
    renameFolder,
    deleteFolder,
    navigate,
  } = useNotes();

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Folder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Folder | null>(null);
  const [menuFolderId, setMenuFolderId] = useState<string | null>(null);

  return (
    <NavigationShell showMobileTabs showFab={false}>
      <header className="sticky top-0 z-20 bg-[#F8F7F5]/95 dark:bg-[#171717]/95 backdrop-blur-md px-5 sm:px-8 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202124] dark:text-[#F4F4F2]">
            Folders
          </h1>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate('search')}
              aria-label="Search folders"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#202124] dark:text-[#F4F4F2] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] cursor-pointer"
            >
              <Search className="h-5 w-5" strokeWidth={1.85} />
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              aria-label="New folder"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[#202124] dark:text-[#F4F4F2] hover:bg-[#EEEEEC]/70 dark:hover:bg-[#222222] cursor-pointer"
            >
              <FolderPlus className="h-5 w-5" strokeWidth={1.85} />
            </button>
          </div>
        </div>
      </header>

      <section className="px-5 sm:px-8 pt-2 space-y-6">
        {/* Primary Folders List */}
        <div className="rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] divide-y divide-[#EEEEEC] dark:divide-[#2E2E2B]">
          {folders.map((folder) => {
            const count = getFolderNoteCount(folder.id);
            const isMenuOpen = menuFolderId === folder.id;

            return (
              <div key={folder.id} className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => navigate('folder-details', { folderId: folder.id })}
                  className="flex flex-1 min-h-[58px] items-center justify-between px-4 py-3 text-left hover:bg-[#F8F7F5]/70 dark:hover:bg-[#2B2B29]/60 transition-colors cursor-pointer rounded-2xl"
                >
                  <span className="flex items-center gap-3.5 min-w-0">
                    <FolderIcon
                      className="h-5 w-5 shrink-0 text-[#D9A928]"
                      strokeWidth={1.85}
                    />
                    <span className="text-[15px] font-medium text-[#202124] dark:text-[#F4F4F2] truncate">
                      {folder.name}
                    </span>
                  </span>

                  <span className="flex items-center gap-2 shrink-0 text-sm text-[#858585] dark:text-[#9A9A96] tabular-nums">
                    <span>{count}</span>
                    <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                </button>

                <div className="pr-2 relative">
                  <button
                    type="button"
                    onClick={() => setMenuFolderId(isMenuOpen ? null : folder.id)}
                    aria-label={`Options for ${folder.name}`}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-[#858585] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {isMenuOpen && (
                    <div
                      onMouseLeave={() => setMenuFolderId(null)}
                      className="absolute right-2 top-11 w-40 rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] py-1.5 z-40"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setMenuFolderId(null);
                          setRenameTarget(folder);
                        }}
                        className="flex w-full min-h-[40px] items-center gap-2.5 px-3.5 text-sm text-[#202124] dark:text-[#F4F4F2] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-[#858585]" />
                        Rename
                      </button>

                      {folders.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuFolderId(null);
                            setDeleteTarget(folder);
                          }}
                          className="flex w-full min-h-[40px] items-center gap-2.5 px-3.5 text-sm text-[#E45B5B] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Archive & Trash Quick Access */}
        <div className="rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] divide-y divide-[#EEEEEC] dark:divide-[#2E2E2B]">
          <button
            type="button"
            onClick={() => navigate('archive')}
            className="flex w-full min-h-[56px] items-center justify-between px-4 py-3 text-left hover:bg-[#F8F7F5]/70 dark:hover:bg-[#2B2B29]/60 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-3.5">
              <Archive className="h-5 w-5 text-[#858585]" strokeWidth={1.8} />
              <span className="text-[15px] font-medium text-[#202124] dark:text-[#F4F4F2]">
                Archived
              </span>
            </span>
            <span className="flex items-center gap-2 text-sm text-[#858585] tabular-nums">
              <span>{archivedNotes.length}</span>
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => navigate('trash')}
            className="flex w-full min-h-[56px] items-center justify-between px-4 py-3 text-left hover:bg-[#F8F7F5]/70 dark:hover:bg-[#2B2B29]/60 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-3.5">
              <Trash2 className="h-5 w-5 text-[#E45B5B]" strokeWidth={1.8} />
              <span className="text-[15px] font-medium text-[#202124] dark:text-[#F4F4F2]">
                Trash
              </span>
            </span>
            <span className="flex items-center gap-2 text-sm text-[#858585] tabular-nums">
              <span>{trashedNotes.length}</span>
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-dashed border-[#D9A928]/60 bg-[#FFF5D9]/45 dark:bg-[#D9A928]/10 text-sm font-semibold text-[#202124] dark:text-[#F4F4F2] hover:bg-[#FFF5D9] dark:hover:bg-[#D9A928]/20 transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4 text-[#D9A928]" strokeWidth={2.2} />
          New Folder
        </button>
      </section>

      <FolderNameDialog
        open={createOpen}
        title="New Folder"
        confirmLabel="Create"
        onSubmit={(name) => createFolder(name)}
        onClose={() => setCreateOpen(false)}
      />

      <FolderNameDialog
        open={Boolean(renameTarget)}
        title="Rename Folder"
        initialValue={renameTarget?.name ?? ''}
        confirmLabel="Rename"
        onSubmit={(name) => {
          if (renameTarget) renameFolder(renameTarget.id, name);
        }}
        onClose={() => setRenameTarget(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="Notes inside this folder will be kept and moved to your first available folder."
        confirmLabel="Delete Folder"
        onConfirm={() => {
          if (deleteTarget) deleteFolder(deleteTarget.id);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </NavigationShell>
  );
}
