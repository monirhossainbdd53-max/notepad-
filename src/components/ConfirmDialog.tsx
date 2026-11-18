import React, { useEffect, useState } from 'react';
import { Check, Folder as FolderIcon, Trash2, X } from 'lucide-react';
import { Folder } from '../types/notes';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {danger && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#E45B5B]/12 text-[#E45B5B]">
            <Trash2 className="h-5 w-5" strokeWidth={1.75} />
          </div>
        )}
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold text-[#202124] dark:text-[#F4F4F2]"
        >
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-[#858585] dark:text-[#9A9A96] leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`min-h-[44px] w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity active:opacity-85 cursor-pointer ${
              danger
                ? 'bg-[#E45B5B] text-white'
                : 'bg-[#202124] text-white dark:bg-[#D9A928] dark:text-[#171717]'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] w-full rounded-xl bg-[#F8F7F5] dark:bg-[#2B2B29] px-4 py-2.5 text-sm font-medium text-[#202124] dark:text-[#F4F4F2] transition-colors hover:bg-[#EEEEEC] dark:hover:bg-[#343431] cursor-pointer"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FolderNameDialogProps {
  open: boolean;
  title: string;
  initialValue?: string;
  confirmLabel?: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

export function FolderNameDialog({
  open,
  title,
  initialValue = '',
  confirmLabel = 'Save',
  onSubmit,
  onClose,
}: FolderNameDialogProps) {
  const [name, setName] = useState(initialValue);

  useEffect(() => {
    if (open) setName(initialValue);
  }, [open, initialValue]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#202124] dark:text-[#F4F4F2]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-[#858585] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Folder name"
          aria-label="Folder name"
          autoFocus
          maxLength={40}
          className="w-full min-h-[46px] rounded-xl bg-[#F8F7F5] dark:bg-[#171717] border border-[#EEEEEC] dark:border-[#2E2E2B] px-4 text-sm text-[#202124] dark:text-[#F4F4F2] placeholder:text-[#858585] focus:outline-none focus:border-[#D9A928]"
        />

        <div className="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] rounded-xl bg-[#F8F7F5] dark:bg-[#2B2B29] px-4 text-sm font-medium text-[#202124] dark:text-[#F4F4F2] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 min-h-[44px] rounded-xl bg-[#202124] dark:bg-[#D9A928] px-4 text-sm font-semibold text-white dark:text-[#171717] disabled:opacity-40 cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

interface FolderPickerDialogProps {
  open: boolean;
  title?: string;
  folders: Folder[];
  selectedFolderId: string;
  onSelect: (folderId: string) => void;
  onClose: () => void;
}

export function FolderPickerDialog({
  open,
  title = 'Move to Folder',
  folders,
  selectedFolderId,
  onSelect,
  onClose,
}: FolderPickerDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] p-6"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#EEEEEC] dark:bg-[#3A3A37] sm:hidden" />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#202124] dark:text-[#F4F4F2]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-[#858585] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="divide-y divide-[#EEEEEC] dark:divide-[#2E2E2B] max-h-72 overflow-y-auto">
          {folders.map((folder) => {
            const active = folder.id === selectedFolderId;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => {
                  onSelect(folder.id);
                  onClose();
                }}
                className="flex w-full min-h-[48px] items-center justify-between py-2.5 px-1 text-left transition-colors hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] rounded-lg cursor-pointer"
              >
                <span className="flex items-center gap-3 text-sm font-medium text-[#202124] dark:text-[#F4F4F2]">
                  <FolderIcon
                    className={`h-4 w-4 ${active ? 'text-[#D9A928]' : 'text-[#858585]'}`}
                    strokeWidth={1.75}
                  />
                  {folder.name}
                </span>
                {active && <Check className="h-4 w-4 text-[#D9A928]" strokeWidth={2.25} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface InfoSheetDialogProps {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

export function InfoSheetDialog({ open, title, children, onClose }: InfoSheetDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B] p-6 max-h-[85vh] flex flex-col"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#EEEEEC] dark:bg-[#3A3A37] sm:hidden" />
        <div className="flex items-center justify-between pb-3 border-b border-[#EEEEEC] dark:border-[#2E2E2B]">
          <h2 className="text-base font-semibold text-[#202124] dark:text-[#F4F4F2]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full text-[#858585] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 overflow-y-auto text-sm text-[#202124] dark:text-[#F4F4F2] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
