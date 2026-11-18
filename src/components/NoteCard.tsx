import React, { useState } from 'react';
import { Image as ImageIcon, Lock, Pin, RotateCcw, Star, Trash2 } from 'lucide-react';
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
  const [imgError, setImgError] = useState(false);
  const titleText = note.title.trim() || 'Untitled Note';
  const isLocked = Boolean(note.isLocked);
  const preview = isLocked ? 'Locked note · Enter PIN to view' : getNotePreview(note.content, 125);
  const dateText = formatNoteDate(note.updatedAt);
  const firstImage = !isLocked && note.images && note.images.length > 0 ? note.images[0] : null;

  return (
    <article className="group rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] transition-colors hover:border-[var(--accent-primary)]/60">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left p-4 sm:p-5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-2xl flex items-start justify-between gap-3.5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] sm:text-base font-semibold text-[var(--text-primary)] leading-snug line-clamp-1">
              {titleText}
            </h3>
            {(isLocked || note.isPinned || note.isFavorite) && (
              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                {isLocked && (
                  <Lock
                    className="h-3.5 w-3.5 text-[var(--text-secondary)]"
                    strokeWidth={2}
                    aria-label="Locked"
                  />
                )}
                {note.isPinned && (
                  <Pin
                    className="h-3.5 w-3.5 text-[var(--accent-primary)] fill-[var(--accent-primary)]"
                    strokeWidth={2}
                    aria-label="Pinned"
                  />
                )}
                {note.isFavorite && (
                  <Star
                    className="h-3.5 w-3.5 text-[var(--accent-primary)] fill-[var(--accent-primary)]"
                    strokeWidth={2}
                    aria-label="Favorite"
                  />
                )}
              </div>
            )}
          </div>

          <p className="mt-1.5 text-[13.5px] sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
            {preview}
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-secondary)] tabular-nums">
            <span>{dateText}</span>
            {showFolderName && folder && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-[140px]">{folder.name}</span>
              </>
            )}
            {!isLocked && note.images && note.images.length > 1 && (
              <>
                <span aria-hidden="true">·</span>
                <span>{note.images.length} photos</span>
              </>
            )}
          </div>
        </div>

        {firstImage && (
          <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-[var(--bg-canvas)] border border-[var(--divider)] flex items-center justify-center">
            {!imgError ? (
              <img
                src={firstImage}
                alt={titleText}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-5 w-5 text-[var(--text-secondary)]" strokeWidth={1.6} />
            )}
          </div>
        )}
      </button>

      {(onRestore || onPermanentDelete) && (
        <div className="flex items-center justify-end gap-2 px-4 pb-3 pt-2 border-t border-[var(--divider)]">
          {onRestore && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRestore();
              }}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-canvas)] hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
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
