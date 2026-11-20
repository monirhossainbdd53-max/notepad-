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
  | 'about'
  | 'admin';

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
  uid?: string;
  name: string;
  email: string;
  photoUrl?: string;
  emailVerified?: boolean;
  isGuest?: boolean;
  lastDriveBackupAt?: string;
  lastTransactionId?: string;
  premiumExpiresAt?: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  variant?: 'default' | 'danger';
  undoAction?: () => void;
}

export interface PreviewModeConfig {
  enabled: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  updatedAt: string;
  updatedBy?: string;
}

export interface AutoBackupSchedule {
  enabled: boolean;
  months: number;
  days: number;
  lastBackupAt?: string;
  nextBackupAt?: string;
}

export interface SupportMessage {
  id: string;
  userEmail: string;
  userName: string;
  userUid?: string;
  subject: string;
  message: string;
  status: 'open' | 'replied';
  adminReply?: string;
  repliedAt?: string;
  repliedBy?: string;
  emailDeliveryStatus?: 'sent' | 'mailto_fallback' | 'not_configured';
  createdAt: string;
  updatedAt: string;
}

export type SocialPlatformId =
  | 'facebook'
  | 'whatsapp'
  | 'instagram'
  | 'youtube'
  | 'x'
  | 'linkedin'
  | 'website';

export interface AboutSocialLink {
  id: SocialPlatformId;
  label: string;
  href: string;
  enabled: boolean;
}

export interface AboutTeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
}

export interface AboutAppConfig {
  ceo: AboutTeamMember | null;
  team: AboutTeamMember[];
  socials: AboutSocialLink[];
  updatedAt: string;
  updatedBy?: string;
}
