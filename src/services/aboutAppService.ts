import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import teamDesignerImg from '../assets/images/team_designer_1795044479332.jpg';
import teamEngineerImg from '../assets/images/team_engineer_1795044479765.jpg';
import teamManagerImg from '../assets/images/team_manager_1795044479272.jpg';
import teamOperationsImg from '../assets/images/team_operations_1795044480807.jpg';
import {
  AboutAppConfig,
  AboutSocialLink,
  AboutTeamMember,
  SocialPlatformId,
} from '../types/notes';
import { ADMIN_EMAIL } from './adminConfigService';
import { auth, firebaseApp, isFirebaseConfigured } from './googleAuthDrive';

const ABOUT_CONFIG_CACHE_KEY = 'notes_about_app_config_cache_v1';

const DEFAULT_CEO_IMAGE =
  '/assets/aistudio/file_0000000064dc820bb4574f2daade8aa3_351ff63f.png';

export const DEFAULT_SOCIAL_LINKS: AboutSocialLink[] = [
  { id: 'facebook', label: 'Facebook', href: 'https://facebook.com', enabled: true },
  { id: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me/', enabled: true },
  { id: 'instagram', label: 'Instagram', href: 'https://instagram.com', enabled: true },
  { id: 'youtube', label: 'YouTube', href: 'https://youtube.com', enabled: true },
  { id: 'x', label: 'X (Twitter)', href: 'https://x.com', enabled: true },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com', enabled: true },
  { id: 'website', label: 'Website', href: 'https://example.com', enabled: true },
];

export const DEFAULT_ABOUT_CONFIG: AboutAppConfig = {
  ceo: {
    id: 'ceo',
    name: 'Riyad Islam',
    role: 'Founder & CEO',
    image: DEFAULT_CEO_IMAGE,
  },
  team: [
    {
      id: 'manager',
      name: 'Nadia Rahman',
      role: 'Product Manager',
      image: teamManagerImg,
    },
    {
      id: 'engineer',
      name: 'Tanvir Ahmed',
      role: 'Lead Engineer',
      image: teamEngineerImg,
    },
    {
      id: 'designer',
      name: 'Daniel Brooks',
      role: 'Product Designer',
      image: teamDesignerImg,
    },
    {
      id: 'operations',
      name: 'Hannah Miller',
      role: 'Operations & Support',
      image: teamOperationsImg,
    },
  ],
  socials: DEFAULT_SOCIAL_LINKS,
  updatedAt: '',
};

const VALID_SOCIAL_IDS = new Set<SocialPlatformId>(
  DEFAULT_SOCIAL_LINKS.map((s) => s.id)
);

function normalizeMember(
  raw: Partial<AboutTeamMember> | null | undefined,
  fallback: AboutTeamMember
): AboutTeamMember {
  return {
    id: typeof raw?.id === 'string' && raw.id.trim() ? raw.id.trim() : fallback.id,
    name: typeof raw?.name === 'string' && raw.name.trim() ? raw.name.trim() : fallback.name,
    role: typeof raw?.role === 'string' && raw.role.trim() ? raw.role.trim() : fallback.role,
    image: typeof raw?.image === 'string' && raw.image.trim() ? raw.image.trim() : fallback.image,
  };
}

export function normalizeAboutConfig(
  raw: Partial<AboutAppConfig> | null | undefined
): AboutAppConfig {
  const ceo = normalizeMember(raw?.ceo, DEFAULT_ABOUT_CONFIG.ceo);

  let team: AboutTeamMember[] = DEFAULT_ABOUT_CONFIG.team;
  if (Array.isArray(raw?.team)) {
    team = raw.team
      .filter((item): item is AboutTeamMember => Boolean(item && typeof item === 'object'))
      .map((item, idx) => ({
        id:
          typeof item.id === 'string' && item.id.trim()
            ? item.id.trim()
            : `member_${idx + 1}`,
        name: typeof item.name === 'string' ? item.name.trim() : '',
        role: typeof item.role === 'string' ? item.role.trim() : '',
        image:
          typeof item.image === 'string' && item.image.trim()
            ? item.image.trim()
            : DEFAULT_CEO_IMAGE,
      }))
      .filter((m) => m.name.length > 0 || m.role.length > 0);
  }

  const incomingMap = new Map<SocialPlatformId, Partial<AboutSocialLink>>();
  if (Array.isArray(raw?.socials)) {
    raw.socials.forEach((item) => {
      if (item && VALID_SOCIAL_IDS.has(item.id as SocialPlatformId)) {
        incomingMap.set(item.id as SocialPlatformId, item);
      }
    });
  }

  const socials: AboutSocialLink[] = DEFAULT_SOCIAL_LINKS.map((def) => {
    const match = incomingMap.get(def.id);
    return {
      id: def.id,
      label: typeof match?.label === 'string' && match.label.trim() ? match.label.trim() : def.label,
      href: typeof match?.href === 'string' ? match.href.trim() : def.href,
      enabled: typeof match?.enabled === 'boolean' ? match.enabled : def.enabled,
    };
  });

  return {
    ceo,
    team,
    socials,
    updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : '',
    updatedBy: typeof raw?.updatedBy === 'string' ? raw.updatedBy : undefined,
  };
}

export function loadCachedAboutConfig(): AboutAppConfig {
  try {
    const raw = localStorage.getItem(ABOUT_CONFIG_CACHE_KEY);
    if (!raw) return DEFAULT_ABOUT_CONFIG;
    return normalizeAboutConfig(JSON.parse(raw) as Partial<AboutAppConfig>);
  } catch {
    return DEFAULT_ABOUT_CONFIG;
  }
}

function cacheAboutConfig(config: AboutAppConfig): void {
  try {
    localStorage.setItem(ABOUT_CONFIG_CACHE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota errors
  }
}

export function subscribeAboutAppConfig(
  onConfig: (config: AboutAppConfig) => void
): () => void {
  if (!isFirebaseConfigured || !firebaseApp) {
    onConfig(loadCachedAboutConfig());
    return () => {};
  }

  try {
    const db = getFirestore(firebaseApp);
    const configRef = doc(db, 'app_config', 'about_app');

    return onSnapshot(
      configRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const normalized = normalizeAboutConfig(snapshot.data() as Partial<AboutAppConfig>);
          cacheAboutConfig(normalized);
          onConfig(normalized);
        } else {
          onConfig(loadCachedAboutConfig());
        }
      },
      () => {
        onConfig(loadCachedAboutConfig());
      }
    );
  } catch {
    onConfig(loadCachedAboutConfig());
    return () => {};
  }
}

export async function saveAboutAppConfig(
  next: Pick<AboutAppConfig, 'ceo' | 'team' | 'socials'>
): Promise<AboutAppConfig> {
  if (!isFirebaseConfigured || !firebaseApp || !auth?.currentUser) {
    throw new Error('Sign in with your admin Google account first.');
  }
  const currentEmail = (auth.currentUser.email || '').trim().toLowerCase();
  if (currentEmail !== ADMIN_EMAIL || !auth.currentUser.emailVerified) {
    throw new Error('Only the verified admin account can update About App settings.');
  }

  const normalized = normalizeAboutConfig({
    ...next,
    updatedAt: new Date().toISOString(),
    updatedBy: currentEmail,
  });

  const payload = {
    ceo: {
      id: normalized.ceo.id,
      name: normalized.ceo.name,
      role: normalized.ceo.role,
      image: normalized.ceo.image,
    },
    team: normalized.team.map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      image: m.image,
    })),
    socials: normalized.socials.map((s) => ({
      id: s.id,
      label: s.label,
      href: s.href,
      enabled: s.enabled,
    })),
    updatedAt: normalized.updatedAt,
    updatedBy: currentEmail,
  };

  const approxBytes = new Blob([JSON.stringify(payload)]).size;
  if (approxBytes > 900_000) {
    throw new Error('Total profile photo data is too large. Use smaller images or photo URLs.');
  }

  const db = getFirestore(firebaseApp);
  const configRef = doc(db, 'app_config', 'about_app');
  await setDoc(configRef, payload, { merge: true });
  cacheAboutConfig(normalized);
  return normalized;
}

export function compressTeamPhotoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format'));
      img.onload = () => {
        const maxSide = 360;
        const scale = Math.min(maxSide / img.width, maxSide / img.height, 1);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
