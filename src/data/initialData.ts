import { Folder, Note, UserAccount } from '../types/notes';

export const DEFAULT_FOLDERS: Folder[] = [];

export const INITIAL_NOTES: Note[] = [];

export const INITIAL_ACCOUNT: UserAccount = {
  name: 'Guest Account',
  email: '',
  photoUrl: '',
  emailVerified: false,
  isGuest: true,
};

export const INITIAL_RECENT_SEARCHES: string[] = [];
