import React from 'react';
import { Pin, RotateCcw, Star, Trash2 } from 'lucide-react';
import { Folder, Note } from '../types/notes';
import { formatNoteDate, getNotePreview } from '../utils/noteHelpers';

interface NoteCardProps {
  note: Note;
  folder?: Folder;
  onClick: () => void;
  showFolderName?: boolean;
  onRestore?: () => void;
  onPermanentDelete?: () => void;
}

export function NoteCard({
  note,
  folder,
  onClick,
  showFolderName = true,
  onRestore,
  onPermanentDelete,
}: NoteCardProps) {
  const titleText = note.title.trim() || 'Untitled Note';
  const preview = getNotePreview(note.content, 125);
  const dateText = formatNoteDate(note.updatedAt);

  return (
    <article
      className="group rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] transition-colors hover:border-[#D9A928]/60 dark:hover:border-[#D9A928]/50"
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left p-4 sm:p-5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9A928] rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] sm:text-base font-semibold text-[#202124] dark:text-[#F4F4F2] leading-snug line-clamp-1">
            {titleText}
          </h3>
          {(note.isPinned || note.isFavorite) && (
            <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
              {note.isPinned && (
                <Pin
                  className="h-3.5 w-3.5 text-[#D9A928] fill-[#D9A928]"
                  strokeWidth={2}
                  aria-label="Pinned"
                />
              )}
              {note.isFavorite && (
                <Star
                  className="h-3.5 w-3.5 text-[#D9A928] fill-[#D9A928]"
                  strokeWidth={2}
                  aria-label="Favorite"
                />
              )}
            </div>
          )}
        </div>

        <p className="mt-1.5 text-[13.5px] sm:text-sm text-[#858585] dark:text-[#9A9A96] leading-relaxed line-clamp-2">
          {preview}
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-[#858585] dark:text-[#9A9A96] tabular-nums">
          <span>{dateText}</span>
          {showFolderName && folder && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[140px]">{folder.name}</span>
            </>
          )}
        </div>
      </button>

      {(onRestore || onPermanentDelete) && (
        <div className="flex items-center justify-end gap-2 px-4 pb-3 pt-2 border-t border-[#EEEEEC] dark:border-[#2E2E2B]">
          {onRestore && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRestore();
              }}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-[#202124] dark:text-[#F4F4F2] bg-[#F8F7F5] dark:bg-[#2B2B29] hover:bg-[#FFF5D9] dark:hover:bg-[#D9A928]/20 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
              Restore
            </button>
          )}
          {onPermanentDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPermanentDelete();
              }}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-[#E45B5B] bg-[#E45B5B]/10 hover:bg-[#E45B5B]/15 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              Delete Forever
            </button>
          )}
        </div>
      )}
    </article>
  );
}
