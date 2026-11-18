import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold,
  Camera,
  CheckSquare,
  Heading2,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Lock,
  Quote,
  Redo2,
  Underline,
  Undo2,
  X,
} from 'lucide-react';
import { useNotes } from '../context/NotesContext';
import { FREE_LIMITS } from '../types/notes';
import { readAndCompressImage } from '../utils/noteHelpers';

interface RichTextEditorProps {
  title: string;
  content: string;
  images: string[];
  onChangeTitle: (title: string) => void;
  onChangeContent: (html: string) => void;
  onChangeImages: (images: string[]) => void;
  autoFocusBody?: boolean;
}

export function RichTextEditor({
  title,
  content,
  images,
  onChangeTitle,
  onChangeContent,
  onChangeImages,
  autoFocusBody = false,
}: RichTextEditorProps) {
  const { isPremium, maxImagesAllowed, requestUpgrade } = useNotes();

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<string[]>([content || '']);
  const historyIndexRef = useRef<number>(0);
  const isInternalChangeRef = useRef<boolean>(false);

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
    orderedList: false,
  });

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== content && !isInternalChangeRef.current) {
      editorRef.current.innerHTML = content || '';
      historyRef.current = [content || ''];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [content]);

  useEffect(() => {
    if (autoFocusBody && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocusBody]);

  const updateToolbarState = useCallback(() => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        unorderedList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
      });
    } catch {
      // Ignore selection errors
    }
  }, []);

  const pushHistory = useCallback((html: string) => {
    const stack = historyRef.current;
    const idx = historyIndexRef.current;
    if (stack[idx] === html) return;
    const nextStack = stack.slice(0, idx + 1);
    nextStack.push(html);
    if (nextStack.length > 60) nextStack.shift();
    historyRef.current = nextStack;
    historyIndexRef.current = nextStack.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const emitChange = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    isInternalChangeRef.current = true;
    pushHistory(html);
    onChangeContent(html);
    window.setTimeout(() => {
      isInternalChangeRef.current = false;
    }, 0);
    updateToolbarState();
  }, [onChangeContent, pushHistory, updateToolbarState]);

  const handleFormat = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    emitChange();
  };

  const handlePremiumFormat = (label: string, action: () => void) => {
    if (!isPremium) {
      requestUpgrade(`${label} is part of Advanced Note Formatting in Notes Premium.`);
      return;
    }
    action();
  };

  const handleInsertChecklist = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const checkHtml =
      '<div class="note-check-item" data-checked="false">' +
      '<span class="note-check-box" role="checkbox" aria-checked="false" tabindex="0"></span>' +
      '<span class="note-check-text">Checklist item</span>' +
      '</div><p><br></p>';
    document.execCommand('insertHTML', false, checkHtml);
    emitChange();
  };

  const handleToggleHeading = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const currentBlock = document.queryCommandValue('formatBlock');
    if (currentBlock && currentBlock.toLowerCase() === 'h2') {
      document.execCommand('formatBlock', false, 'p');
    } else {
      document.execCommand('formatBlock', false, 'h2');
    }
    emitChange();
  };

  const handleToggleBlockquote = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const currentBlock = document.queryCommandValue('formatBlock');
    if (currentBlock && currentBlock.toLowerCase() === 'blockquote') {
      document.execCommand('formatBlock', false, 'p');
    } else {
      document.execCommand('formatBlock', false, 'blockquote');
    }
    emitChange();
  };

  const handleImageTrigger = (picker: 'gallery' | 'camera') => {
    if (!isPremium && images.length >= maxImagesAllowed) {
      requestUpgrade(
        `Free plan allows ${FREE_LIMITS.maxImagesPerNote} image per note. Upgrade to Notes Premium for unlimited images.`
      );
      return;
    }
    if (picker === 'gallery') {
      fileInputRef.current?.click();
    } else {
      cameraInputRef.current?.click();
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = isPremium ? files.length : Math.max(0, maxImagesAllowed - images.length);
    if (remainingSlots <= 0) {
      requestUpgrade(
        `Free plan allows ${FREE_LIMITS.maxImagesPerNote} image per note. Upgrade to Notes Premium for unlimited images.`
      );
      return;
    }

    const loaded: string[] = [];
    for (const file of Array.from(files).slice(0, remainingSlots)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const compressed = await readAndCompressImage(file);
        loaded.push(compressed);
      } catch {
        // Skip unreadable image
      }
    }
    if (loaded.length > 0) {
      onChangeImages([...images, ...loaded]);
      if (!isPremium && files.length > remainingSlots) {
        requestUpgrade(
          `Only ${FREE_LIMITS.maxImagesPerNote} image was attached on the Free plan. Upgrade for unlimited images.`
        );
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) imageFiles.push(f);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      if (!isPremium && images.length >= maxImagesAllowed) {
        requestUpgrade(
          `Free plan allows ${FREE_LIMITS.maxImagesPerNote} image per note. Upgrade to Notes Premium for unlimited images.`
        );
        return;
      }
      const loaded: string[] = [];
      for (const file of imageFiles.slice(0, isPremium ? imageFiles.length : 1)) {
        try {
          loaded.push(await readAndCompressImage(file));
        } catch {
          // Ignore
        }
      }
      if (loaded.length > 0) {
        onChangeImages([...images, ...loaded]);
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    onChangeImages(images.filter((_, i) => i !== index));
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0 || !editorRef.current) return;
    historyIndexRef.current -= 1;
    const prevHtml = historyRef.current[historyIndexRef.current];
    editorRef.current.innerHTML = prevHtml;
    isInternalChangeRef.current = true;
    onChangeContent(prevHtml);
    window.setTimeout(() => {
      isInternalChangeRef.current = false;
    }, 0);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    updateToolbarState();
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1 || !editorRef.current) return;
    historyIndexRef.current += 1;
    const nextHtml = historyRef.current[historyIndexRef.current];
    editorRef.current.innerHTML = nextHtml;
    isInternalChangeRef.current = true;
    onChangeContent(nextHtml);
    window.setTimeout(() => {
      isInternalChangeRef.current = false;
    }, 0);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    updateToolbarState();
  };

  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const box = target.closest('.note-check-box') as HTMLElement | null;
    if (box) {
      e.preventDefault();
      const item = box.closest('.note-check-item') as HTMLElement | null;
      if (!item) return;
      const isChecked = item.getAttribute('data-checked') === 'true';
      item.setAttribute('data-checked', isChecked ? 'false' : 'true');
      box.setAttribute('aria-checked', isChecked ? 'false' : 'true');
      box.innerHTML = isChecked
        ? ''
        : '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      emitChange();
    } else {
      updateToolbarState();
    }
  };

  const toolbarBtnClass = (active = false, disabled = false) =>
    `relative min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
      disabled
        ? 'opacity-30 cursor-not-allowed text-[var(--text-secondary)]'
        : active
        ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)]'
        : 'text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
    }`;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={isPremium}
        className="hidden"
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Formatting & Image Toolbar */}
      <div className="sticky top-[57px] z-20 bg-[var(--bg-canvas)]/95 backdrop-blur-sm border-b border-[var(--divider)] px-4 sm:px-6 py-2">
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Free Basic Formatting */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat('bold');
              }}
              aria-label="Bold"
              title="Bold"
              className={toolbarBtnClass(activeFormats.bold)}
            >
              <Bold className="h-4 w-4" strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat('italic');
              }}
              aria-label="Italic"
              title="Italic"
              className={toolbarBtnClass(activeFormats.italic)}
            >
              <Italic className="h-4 w-4" strokeWidth={2} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat('underline');
              }}
              aria-label="Underline"
              title="Underline"
              className={toolbarBtnClass(activeFormats.underline)}
            >
              <Underline className="h-4 w-4" strokeWidth={2} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat('insertUnorderedList');
              }}
              aria-label="Bullet list"
              title="Bullet list"
              className={toolbarBtnClass(activeFormats.unorderedList)}
            >
              <List className="h-4 w-4" strokeWidth={2} />
            </button>

            <div className="mx-1 h-4 w-px bg-[var(--divider)]" />

            {/* Premium Advanced Formatting */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handlePremiumFormat('Heading formatting', handleToggleHeading);
              }}
              aria-label="Heading"
              title={isPremium ? 'Heading' : 'Heading (Premium)'}
              className={toolbarBtnClass(false)}
            >
              <Heading2 className="h-4 w-4" strokeWidth={2} />
              {!isPremium && (
                <Lock className="h-2.5 w-2.5 absolute bottom-1 right-1 text-[var(--accent-primary)]" />
              )}
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handlePremiumFormat('Quote blocks', handleToggleBlockquote);
              }}
              aria-label="Quote"
              title={isPremium ? 'Quote' : 'Quote (Premium)'}
              className={toolbarBtnClass(false)}
            >
              <Quote className="h-3.5 w-3.5" strokeWidth={2} />
              {!isPremium && (
                <Lock className="h-2.5 w-2.5 absolute bottom-1 right-1 text-[var(--accent-primary)]" />
              )}
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handlePremiumFormat('Numbered lists', () => handleFormat('insertOrderedList'));
              }}
              aria-label="Numbered list"
              title={isPremium ? 'Numbered list' : 'Numbered list (Premium)'}
              className={toolbarBtnClass(activeFormats.orderedList)}
            >
              <ListOrdered className="h-4 w-4" strokeWidth={2} />
              {!isPremium && (
                <Lock className="h-2.5 w-2.5 absolute bottom-1 right-1 text-[var(--accent-primary)]" />
              )}
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handlePremiumFormat('Interactive checklists', handleInsertChecklist);
              }}
              aria-label="Checklist"
              title={isPremium ? 'Checklist' : 'Checklist (Premium)'}
              className={toolbarBtnClass(false)}
            >
              <CheckSquare className="h-4 w-4" strokeWidth={2} />
              {!isPremium && (
                <Lock className="h-2.5 w-2.5 absolute bottom-1 right-1 text-[var(--accent-primary)]" />
              )}
            </button>

            <div className="mx-1 h-4 w-px bg-[var(--divider)]" />

            <button
              type="button"
              onClick={() => handleImageTrigger('gallery')}
              aria-label="Add image"
              title="Add image"
              className={toolbarBtnClass(false)}
            >
              <ImagePlus className="h-4 w-4" strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => handleImageTrigger('camera')}
              aria-label="Take photo"
              title="Take photo"
              className={toolbarBtnClass(false)}
            >
              <Camera className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleUndo();
              }}
              disabled={!canUndo}
              aria-label="Undo"
              title="Undo"
              className={toolbarBtnClass(false, !canUndo)}
            >
              <Undo2 className="h-4 w-4" strokeWidth={2} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleRedo();
              }}
              disabled={!canRedo}
              aria-label="Redo"
              title="Redo"
              className={toolbarBtnClass(false, !canRedo)}
            >
              <Redo2 className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* Distraction-free writing & media area */}
      <div className="flex-1 px-4 sm:px-8 pt-6 pb-20">
        <input
          type="text"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Note title"
          aria-label="Note title"
          className="w-full bg-transparent text-2xl sm:text-[28px] font-bold tracking-tight text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none"
        />

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Start writing..."
          onInput={emitChange}
          onKeyUp={updateToolbarState}
          onMouseUp={updateToolbarState}
          onClick={handleEditorClick}
          onPaste={handlePaste}
          aria-label="Note content"
          className="note-content mt-4 min-h-[260px] text-[15.5px] sm:text-base text-[var(--text-primary)] focus:outline-none"
        />

        {images.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {images.map((src, idx) => (
              <div
                key={`${idx}_${src.slice(0, 32)}`}
                className="relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)]"
              >
                <img
                  src={src}
                  alt={`Note attachment ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-72 object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  aria-label="Remove image"
                  className="absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#202124]/80 text-white hover:bg-[#E45B5B] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
