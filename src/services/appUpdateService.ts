import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const DISMISSED_VERSION_KEY = 'notes_dismissed_apk_version_v1';
const DOWNLOADED_VERSION_KEY = 'notes_downloaded_apk_version_v1';
const LATEST_RELEASE_KEY = 'notes_latest_apk_release_v1';
const LAST_CHECK_AT_KEY = 'notes_apk_update_last_check_v1';
const CHECK_THROTTLE_MS = 15 * 60 * 1000;
export const APP_UPDATE_STATE_EVENT = 'notes-app-update-state-changed';

export interface AppUpdateInfo {
  latestVersion: string;
  currentVersion: string;
  downloadUrl: string;
  releasePageUrl: string;
  releaseNotes: string;
}

export interface AboutAppUpdateState {
  latestVersion: string;
  downloadUrl: string;
  isDownloaded: boolean;
}

function emitUpdateStateChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(APP_UPDATE_STATE_EVENT));
  }
}

function normalizeVersion(raw: string): string {
  return raw.trim().replace(/^v/i, '');
}

export function compareVersions(latestRaw: string, currentRaw: string): number {
  const parse = (v: string) =>
    normalizeVersion(v)
      .split(/[.+-]/)
      .map((part) => {
        const num = Number.parseInt(part, 10);
        return Number.isFinite(num) ? num : 0;
      });

  const a = parse(latestRaw);
  const b = parse(currentRaw);
  const len = Math.max(a.length, b.length);

  for (let i = 0; i < len; i += 1) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

export async function getInstalledAppVersion(): Promise<string> {
  const fallback = normalizeVersion(import.meta.env.VITE_APP_VERSION || '1.0.0') || '1.0.0';
  try {
    if (Capacitor.isNativePlatform()) {
      const info = await App.getInfo();
      if (info?.version) {
        return normalizeVersion(info.version);
      }
    }
  } catch {
    // Fallback to build-time version
  }
  return fallback;
}

export function dismissAppUpdateVersion(version: string): void {
  try {
    localStorage.setItem(DISMISSED_VERSION_KEY, normalizeVersion(version));
    emitUpdateStateChange();
  } catch {
    // Ignore storage errors
  }
}

export function markApkVersionDownloaded(version: string): void {
  try {
    const normalized = normalizeVersion(version);
    localStorage.setItem(DOWNLOADED_VERSION_KEY, normalized);
    localStorage.setItem(DISMISSED_VERSION_KEY, normalized);
    emitUpdateStateChange();
  } catch {
    // Ignore storage errors
  }
}

function saveLatestReleaseCache(info: AppUpdateInfo): void {
  try {
    localStorage.setItem(LATEST_RELEASE_KEY, JSON.stringify(info));
    emitUpdateStateChange();
  } catch {
    // Ignore storage errors
  }
}

function clearLatestReleaseCache(): void {
  try {
    localStorage.removeItem(LATEST_RELEASE_KEY);
    emitUpdateStateChange();
  } catch {
    // Ignore storage errors
  }
}

export function getAboutAppUpdateState(currentVersion: string): AboutAppUpdateState | null {
  try {
    const raw = localStorage.getItem(LATEST_RELEASE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw) as Partial<AppUpdateInfo>;
    const latestVersion = normalizeVersion(cached.latestVersion || '');
    const downloadUrl = (cached.downloadUrl || '').trim();
    if (!latestVersion || !downloadUrl) return null;

    if (compareVersions(latestVersion, currentVersion) <= 0) {
      return null;
    }

    const dismissed = normalizeVersion(localStorage.getItem(DISMISSED_VERSION_KEY) || '');
    const downloaded = normalizeVersion(localStorage.getItem(DOWNLOADED_VERSION_KEY) || '');
    const isDownloaded = downloaded === latestVersion;
    const isDismissed = dismissed === latestVersion;

    if (!isDismissed && !isDownloaded) {
      return null;
    }

    return {
      latestVersion,
      downloadUrl,
      isDownloaded,
    };
  } catch {
    return null;
  }
}

export async function checkForGitHubApkUpdate(force = false): Promise<AppUpdateInfo | null> {
  try {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return null;
    }

    const repo = (import.meta.env.VITE_GITHUB_REPO || '').trim();
    if (!repo || !repo.includes('/')) {
      return null;
    }

    if (!force) {
      const lastCheckRaw = localStorage.getItem(LAST_CHECK_AT_KEY);
      const lastCheck = lastCheckRaw ? Number(lastCheckRaw) : 0;
      if (Number.isFinite(lastCheck) && Date.now() - lastCheck < CHECK_THROTTLE_MS) {
        return null;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return null;
    }

    localStorage.setItem(LAST_CHECK_AT_KEY, String(Date.now()));

    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const release = (await res.json()) as {
      tag_name?: string;
      name?: string;
      body?: string;
      html_url?: string;
      draft?: boolean;
      prerelease?: boolean;
      assets?: Array<{ name?: string; browser_download_url?: string }>;
    };

    if (release.draft || release.prerelease || !release.tag_name) {
      return null;
    }

    const latestVersion = normalizeVersion(release.tag_name);
    const currentVersion = await getInstalledAppVersion();

    if (compareVersions(latestVersion, currentVersion) <= 0) {
      clearLatestReleaseCache();
      return null;
    }

    const apkAsset = release.assets?.find(
      (a) =>
        typeof a.name === 'string' &&
        a.name.toLowerCase().endsWith('.apk') &&
        typeof a.browser_download_url === 'string'
    );

    const releasePageUrl =
      release.html_url || `https://github.com/${repo}/releases/latest`;
    const downloadUrl = apkAsset?.browser_download_url || releasePageUrl;

    const updateInfo: AppUpdateInfo = {
      latestVersion,
      currentVersion,
      downloadUrl,
      releasePageUrl,
      releaseNotes: (release.body || '').trim(),
    };

    saveLatestReleaseCache(updateInfo);

    const dismissed = normalizeVersion(localStorage.getItem(DISMISSED_VERSION_KEY) || '');
    if (!force && dismissed && dismissed === latestVersion) {
      return null;
    }

    return updateInfo;
  } catch {
    return null;
  }
}
