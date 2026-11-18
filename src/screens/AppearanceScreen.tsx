import React from 'react';
import { Check, ChevronLeft, Lock, Monitor, Moon, Sun } from 'lucide-react';
import { NavigationShell } from '../components/NavigationShell';
import { useNotes } from '../context/NotesContext';
import { ThemePalette, ThemePreference } from '../types/notes';

export function AppearanceScreen() {
  const { theme, setTheme, palette, setPalette, isPremium, goBack } = useNotes();

  const modeOptions: {
    id: ThemePreference;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }[] = [
    {
      id: 'light',
      label: 'Light Mode',
      description: 'Warm paper background with crisp dark typography',
      icon: Sun,
    },
    {
      id: 'dark',
      label: 'Dark Mode',
      description: 'Low-glare charcoal canvas for comfortable evening writing',
      icon: Moon,
    },
    {
      id: 'system',
      label: 'System Default',
      description: 'Automatically match your device appearance setting',
      icon: Monitor,
    },
  ];

  const paletteOptions: {
    id: ThemePalette;
    name: string;
    description: string;
    swatch: string;
    accent: string;
    premiumOnly: boolean;
  }[] = [
    {
      id: 'default',
      name: 'Classic Warm',
      description: 'Signature warm paper and amber gold',
      swatch: '#F8F7F5',
      accent: '#D9A928',
      premiumOnly: false,
    },
    {
      id: 'sepia',
      name: 'Warm Sepia',
      description: 'Soft archival paper for long-form reading',
      swatch: '#F5EFE4',
      accent: '#B88022',
      premiumOnly: true,
    },
    {
      id: 'sage',
      name: 'Botanical Sage',
      description: 'Quiet muted green mineral surface',
      swatch: '#F2F5F2',
      accent: '#4A7856',
      premiumOnly: true,
    },
    {
      id: 'slate',
      name: 'Crisp Slate',
      description: 'Cool ink-inspired studio tone',
      swatch: '#F2F4F7',
      accent: '#436496',
      premiumOnly: true,
    },
  ];

  const activePalette = isPremium ? palette : 'default';

  return (
    <NavigationShell showMobileTabs={false}>
      <header className="sticky top-0 z-20 bg-[var(--bg-canvas)]/95 backdrop-blur-md px-4 sm:px-8 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goBack}
            aria-label="Back"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Appearance
          </h1>
        </div>
      </header>

      <section className="px-5 sm:px-8 pt-3 pb-12 space-y-6">
        {/* Light / Dark / System */}
        <div>
          <h2 className="px-1 mb-2 text-xs font-semibold text-[var(--text-secondary)]">
            Theme Mode
          </h2>
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] divide-y divide-[var(--divider)]">
            {modeOptions.map((opt) => {
              const Icon = opt.icon;
              const selected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id)}
                  className="flex w-full min-h-[68px] items-center justify-between gap-4 px-4 py-3 text-left hover:bg-[var(--bg-subtle)]/60 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-3.5">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        selected
                          ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                          : 'bg-[var(--bg-canvas)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.85} />
                    </span>
                    <span>
                      <span className="block text-[15px] font-medium text-[var(--text-primary)]">
                        {opt.label}
                      </span>
                      <span className="block text-xs text-[var(--text-secondary)] mt-0.5">
                        {opt.description}
                      </span>
                    </span>
                  </span>

                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      selected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white dark:text-[#171717]'
                        : 'border-[var(--text-secondary)]/40'
                    }`}
                  >
                    {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Premium Color Palettes */}
        <div>
          <h2 className="px-1 mb-2 text-xs font-semibold text-[var(--text-secondary)]">
            Color Themes
          </h2>
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] divide-y divide-[var(--divider)]">
            {paletteOptions.map((item) => {
              const selected = activePalette === item.id;
              const locked = item.premiumOnly && !isPremium;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPalette(item.id)}
                  className="flex w-full min-h-[66px] items-center justify-between gap-4 px-4 py-3 text-left hover:bg-[var(--bg-subtle)]/60 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-3.5">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--divider)]"
                      style={{ backgroundColor: item.swatch }}
                    >
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: item.accent }}
                      />
                    </span>
                    <span>
                      <span className="block text-[15px] font-medium text-[var(--text-primary)]">
                        {item.name}
                      </span>
                      <span className="block text-xs text-[var(--text-secondary)] mt-0.5">
                        {item.description}
                      </span>
                    </span>
                  </span>

                  {locked ? (
                    <Lock className="h-4 w-4 shrink-0 text-[var(--accent-primary)]" strokeWidth={1.9} />
                  ) : (
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        selected
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white dark:text-[#171717]'
                          : 'border-[var(--text-secondary)]/40'
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Theme Preview Card */}
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] p-5">
          <p className="text-xs font-medium text-[var(--text-secondary)]">Preview</p>
          <h2 className="mt-2 text-base font-semibold text-[var(--text-primary)]">
            Morning reading notes
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Warm surfaces and high-contrast typography adapt seamlessly across every screen.
          </p>
        </div>
      </section>
    </NavigationShell>
  );
}
