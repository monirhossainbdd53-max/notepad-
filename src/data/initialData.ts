import { Folder, Note, UserAccount } from '../types/notes';

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

export const DEFAULT_FOLDERS: Folder[] = [
  { id: 'folder_personal', name: 'Personal', isDefault: true, createdAt: daysAgo(30) },
  { id: 'folder_work', name: 'Work', isDefault: true, createdAt: daysAgo(30) },
  { id: 'folder_ideas', name: 'Ideas', isDefault: true, createdAt: daysAgo(28) },
  { id: 'folder_projects', name: 'Projects', isDefault: true, createdAt: daysAgo(25) },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note_1',
    title: 'Home renovation notes',
    content:
      '<p>Focusing on warm natural materials for the living room and kitchen updates this spring.</p>' +
      '<div class="note-check-item" data-checked="true"><span class="note-check-box" role="checkbox" aria-checked="true" tabindex="0"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span><span class="note-check-text">Measure north wall shelving clearance</span></div>' +
      '<div class="note-check-item" data-checked="false"><span class="note-check-box" role="checkbox" aria-checked="false" tabindex="0"></span><span class="note-check-text">Compare matte white oak samples</span></div>' +
      '<div class="note-check-item" data-checked="false"><span class="note-check-box" role="checkbox" aria-checked="false" tabindex="0"></span><span class="note-check-text">Finalize brushed brass hardware finish</span></div>' +
      '<p>Keep lighting warm around 2700K across the dining pendant and recessed fixtures.</p>',
    images: ['/src/assets/images/renovation_living_room_1795037423355.jpg'],
    folderId: 'folder_personal',
    isPinned: true,
    isFavorite: true,
    isArchived: false,
    isDeleted: false,
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(2),
  },
  {
    id: 'note_2',
    title: 'Q4 product architecture review',
    content:
      '<p>Key takeaways from this morning’s engineering alignment session:</p>' +
      '<ul><li>Simplify offline caching layer before adding background sync.</li><li>Reduce bundle weight on the mobile reader view by deferring secondary modals.</li><li>Standardize typographic scale across card lists and detail sheets.</li></ul>',
    folderId: 'folder_work',
    isPinned: true,
    isFavorite: false,
    isArchived: false,
    isDeleted: false,
    createdAt: daysAgo(5),
    updatedAt: hoursAgo(6),
  },
  {
    id: 'note_3',
    title: 'Minimalist reader interface concepts',
    content:
      '<p>Inspiration from classic paper notebooks and quiet reading apps. Keep margins generous, avoid decorative badges, and rely on crisp hierarchy instead of heavy borders.</p>' +
      '<p>Explore <u>warm off-white</u> canvas paired with subtle hairline dividers.</p>',
    folderId: 'folder_ideas',
    isPinned: false,
    isFavorite: true,
    isArchived: false,
    isDeleted: false,
    createdAt: daysAgo(6),
    updatedAt: daysAgo(1),
  },
  {
    id: 'note_4',
    title: 'Coffee dialing journal',
    content:
      '<p><b>Washed Ethiopia Guji — Light Roast</b></p>' +
      '<ol><li>18g dose, 36g yield in 29 seconds at 93°C.</li><li>Clean bergamot aroma with a sweet honey finish.</li><li>Try one notch finer tomorrow to bring out slightly more body.</li></ol>',
    folderId: 'folder_personal',
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    isDeleted: false,
    createdAt: daysAgo(9),
    updatedAt: daysAgo(2),
  },
  {
    id: 'note_5',
    title: 'Design system typography tokens',
    content:
      '<p>Documenting font sizes and spacing rhythm for the upcoming web release. Display headings at 28px–32px bold, body text at 15px–16px regular with 1.65 line height, and muted metadata at 12px–13px.</p>',
    folderId: 'folder_projects',
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    isDeleted: false,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(4),
  },
  {
    id: 'note_6',
    title: 'Book highlights: Calm Technology',
    content:
      '<p>Technology should require the smallest possible amount of attention. Information should move smoothly between the periphery and the center of focus without demanding constant alerts.</p>',
    folderId: 'folder_ideas',
    isPinned: false,
    isFavorite: true,
    isArchived: false,
    isDeleted: false,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(5),
  },
  {
    id: 'note_7',
    title: 'Summer studio exhibition notes',
    content:
      '<p>Archived notes from the gallery walkthrough in July. Good reference for framing proportions and natural skylight placement.</p>',
    folderId: 'folder_ideas',
    isPinned: false,
    isFavorite: false,
    isArchived: true,
    isDeleted: false,
    createdAt: daysAgo(40),
    updatedAt: daysAgo(20),
  },
  {
    id: 'note_8',
    title: 'Old conference draft outline',
    content:
      '<p>Early rough outline for the autumn workshop session. Replaced by the revised product architecture document.</p>',
    folderId: 'folder_work',
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    isDeleted: true,
    createdAt: daysAgo(25),
    updatedAt: daysAgo(14),
    deletedAt: daysAgo(2),
  },
];

export const INITIAL_ACCOUNT: UserAccount = {
  name: 'Riyad Islam',
  email: 'riyadislambdd@gmail.com',
};

export const INITIAL_RECENT_SEARCHES: string[] = [
  'Renovation',
  'Architecture',
  'Typography',
];
