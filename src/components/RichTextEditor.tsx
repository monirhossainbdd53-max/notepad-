import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold,
  Camera,
  CheckSquare,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
  X,
} from 'lucide-react';
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

  const handleFormat = (command: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false);
    emitChange();
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

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const loaded: string[] = [];
    for (const file of Array.from(files)) {
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
      const loaded: string[] = [];
      for (const file of imageFiles) {
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
    `min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
      disabled
        ? 'opacity-30 cursor-not-allowed text-[#858585]'
        : active
        ? 'bg-[#FFF5D9] dark:bg-[#D9A928]/20 text-[#D9A928]'
        : 'text-[#202124] dark:text-[#F4F4F2] hover:bg-[#F8F7F5] dark:hover:bg-[#2B2B29]'
    }`;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Hidden image file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
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
      <div className="sticky top-[57px] z-20 bg-[#F8F7F5]/95 dark:bg-[#171717]/95 backdrop-blur-sm border-b border-[#EEEEEC] dark:border-[#2E2E2B] px-4 sm:px-6 py-2">
        <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-0.5 sm:gap-1">
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

            <div className="mx-1 h-4 w-px bg-[#EEEEEC] dark:bg-[#2E2E2B]" />

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

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleFormat('insertOrderedList');
              }}
              aria-label="Numbered list"
              title="Numbered list"
              className={toolbarBtnClass(activeFormats.orderedList)}
            >
              <ListOrdered className="h-4 w-4" strokeWidth={2} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleInsertChecklist();
              }}
              aria-label="Checklist"
              title="Checklist"
              className={toolbarBtnClass(false)}
            >
              <CheckSquare className="h-4 w-4" strokeWidth={2} />
            </button>

            <div className="mx-1 h-4 w-px bg-[#EEEEEC] dark:bg-[#2E2E2B]" />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Add image"
              title="Add image"
              className={toolbarBtnClass(false)}
            >
              <ImagePlus className="h-4 w-4" strokeWidth={2} />
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
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
          className="w-full bg-transparent text-2xl sm:text-[28px] font-bold tracking-tight text-[#202124] dark:text-[#F4F4F2] placeholder:text-[#858585]/60 focus:outline-none"
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
          className="note-content mt-4 min-h-[260px] text-[15.5px] sm:text-base text-[#202124] dark:text-[#F4F4F2] focus:outline-none"
        />

        {/* Attached Images Grid */}
        {images.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {images.map((src, idx) => (
              <div
                key={`${idx}_${src.slice(0, 32)}`}
                className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#222222] border border-[#EEEEEC] dark:border-[#2E2E2B]"
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
