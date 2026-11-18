export type ScreenName =
  | 'splash'
  | 'onboarding'
  | 'home'
  | 'create-note'
  | 'edit-note'
  | 'note-details'
  | 'all-notes'
  | 'pinned-notes'
  | 'favorites'
  | 'folders'
  | 'folder-details'
  | 'search'
  | 'archive'
  | 'trash'
  | 'settings'
  | 'appearance'
  | 'account'
  | 'premium'
  | 'help'
  | 'about';

export type ThemePreference = 'light' | 'dark' | 'system';

export type ThemePalette = 'default' | 'sepia' | 'sage' | 'slate';

export type NoteFontSize = 'small' | 'medium' | 'large';

export type NoteSortOption = 'updated' | 'title' | 'pinned';

export const FREE_LIMITS = {
  maxActiveNotes: 25,
  maxFolders: 4,
  maxImagesPerNote: 1,
} as const;

export interface Note {
  id: string;
  title: string;
  content: string;
  images?: string[];
  folderId: string;
  isPinned: boolean;
  isFavorite: boolean;
  isLocked?: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Folder {
  id: string;
  name: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface NotificationSettings {
  dailyReminder: boolean;
  weeklyDigest: boolean;
  subtleSounds: boolean;
}

export interface UserAccount {
  name: string;
  email: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  variant?: 'default' | 'danger';
  undoAction?: () => void;
}
