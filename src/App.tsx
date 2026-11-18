import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { UpgradePromptDialog } from './components/PinDialog';
import { NotesProvider, useNotes } from './context/NotesContext';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { NotesHomeScreen } from './screens/NotesHomeScreen';
import { NoteEditorScreen } from './screens/NoteEditorScreen';
import { NoteDetailsScreen } from './screens/NoteDetailsScreen';
import { AllNotesScreen } from './screens/AllNotesScreen';
import { PinnedNotesScreen } from './screens/PinnedNotesScreen';
import { FavoriteNotesScreen } from './screens/FavoriteNotesScreen';
import { FoldersScreen } from './screens/FoldersScreen';
import { FolderDetailsScreen } from './screens/FolderDetailsScreen';
import { SearchScreen } from './screens/SearchScreen';
import { ArchiveScreen } from './screens/ArchiveScreen';
import { TrashScreen } from './screens/TrashScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { AppearanceScreen } from './screens/AppearanceScreen';
import { AccountScreen } from './screens/AccountScreen';
import { PremiumScreen } from './screens/PremiumScreen';
import { HelpSupportScreen } from './screens/HelpSupportScreen';
import { AboutAppScreen } from './screens/AboutAppScreen';

function ScreenRouter() {
  const {
    screen,
    toast,
    dismissToast,
    upgradePromptReason,
    dismissUpgradePrompt,
    navigate,
  } = useNotes();

  const renderScreen = () => {
    switch (screen) {
      case 'splash':
        return <SplashScreen />;
      case 'onboarding':
        return <OnboardingScreen />;
      case 'home':
        return <NotesHomeScreen />;
      case 'create-note':
        return <NoteEditorScreen mode="create" />;
      case 'edit-note':
        return <NoteEditorScreen mode="edit" />;
      case 'note-details':
        return <NoteDetailsScreen />;
      case 'all-notes':
        return <AllNotesScreen />;
      case 'pinned-notes':
        return <PinnedNotesScreen />;
      case 'favorites':
        return <FavoriteNotesScreen />;
      case 'folders':
        return <FoldersScreen />;
      case 'folder-details':
        return <FolderDetailsScreen />;
      case 'search':
        return <SearchScreen />;
      case 'archive':
        return <ArchiveScreen />;
      case 'trash':
        return <TrashScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'appearance':
        return <AppearanceScreen />;
      case 'account':
        return <AccountScreen />;
      case 'premium':
        return <PremiumScreen />;
      case 'help':
        return <HelpSupportScreen />;
      case 'about':
        return <AboutAppScreen />;
      default:
        return <NotesHomeScreen />;
    }
  };

  return (
    <>
      {renderScreen()}

      <UpgradePromptDialog
        reason={upgradePromptReason}
        onUpgrade={() => navigate('premium')}
        onClose={dismissUpgradePrompt}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 rounded-full bg-[#202124] dark:bg-[var(--bg-card)] border border-transparent dark:border-[var(--divider)] px-4 py-2 text-xs font-medium text-white dark:text-[var(--text-primary)] whitespace-nowrap">
            <button
              type="button"
              onClick={dismissToast}
              className="flex items-center gap-2 cursor-pointer"
            >
              {toast.variant === 'danger' ? (
                <AlertCircle className="h-3.5 w-3.5 text-[#E45B5B]" strokeWidth={2.2} />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent-primary)]" strokeWidth={2.2} />
              )}
              <span>{toast.text}</span>
            </button>

            {toast.undoAction && (
              <button
                type="button"
                onClick={() => {
                  const fn = toast.undoAction;
                  dismissToast();
                  fn?.();
                }}
                className="pl-2 border-l border-white/20 dark:border-[var(--divider)] font-semibold text-[#D9A928] hover:opacity-85 cursor-pointer"
              >
                Undo
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <NotesProvider>
      <ScreenRouter />
    </NotesProvider>
  );
}
