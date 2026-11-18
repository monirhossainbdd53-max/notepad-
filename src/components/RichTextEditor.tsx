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

interface DragGhostState {
  src: string;
  x: number;
  y: number;
}

function createImageBlockElement(src: string): HTMLDivElement {
  const block = document.createElement('div');
  block.className = 'note-image-block';
  block.setAttribute('contenteditable', 'false');
  block.setAttribute('data-image-block', 'true');

  const img = document.createElement('img');
  img.src = src;
  img.alt = 'Note image';
  img.setAttribute('referrerpolicy', 'no-referrer');
  img.setAttribute('draggable', 'false');

  const controls = document.createElement('div');
  controls.className = 'note-image-controls';

  const dragBtn = document.createElement('button');
  dragBtn.type = 'button';
  dragBtn.className = 'note-img-drag';
  dragBtn.setAttribute('data-action', 'drag-image');
  dragBtn.setAttribute('aria-label', 'Drag to move image');
  dragBtn.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'note-img-remove';
  removeBtn.setAttribute('data-action', 'remove-image');
  removeBtn.setAttribute('aria-label', 'Remove image');
  removeBtn.innerHTML =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  controls.appendChild(dragBtn);
  controls.appendChild(removeBtn);
  block.appendChild(img);
  block.appendChild(controls);

  return block;
}

function getChildNodeRect(node: ChildNode): DOMRect | null {
  if (node.nodeType === Node.ELEMENT_NODE) {
    return (node as HTMLElement).getBoundingClientRect();
  }
  if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim().length > 0) {
    const range = document.createRange();
    range.selectNodeContents(node);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) return rect;
  }
  return null;
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

  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<string[]>([content || '']);
  const historyIndexRef = useRef<number>(0);
  const isInternalChangeRef = useRef<boolean>(false);
  const savedRangeRef = useRef<Range | null>(null);

  const dragSessionRef = useRef<{
    blockEl: HTMLElement;
    imgSrc: string;
    startX: number;
    startY: number;
    active: boolean;
    insertBeforeNode: ChildNode | null;
  } | null>(null);

  const [dragGhost, setDragGhost] = useState<DragGhostState | null>(null);
  const [dropIndicatorTop, setDropIndicatorTop] = useState<number | null>(null);

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
    orderedList: false,
  });

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const saveSelection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== content && !isInternalChangeRef.current) {
      editorRef.current.innerHTML = content || '';
      historyRef.current = [content || ''];
      historyIndexRef.current = 0;
      savedRangeRef.current = null;
      setCanUndo(false);
      setCanRedo(false);
    }
  }, [content]);

  useEffect(() => {
    if (autoFocusBody && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocusBody]);

  useEffect(() => {
    const handleSelectionChange = () => {
      const editor = editorRef.current;
      if (!editor) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

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

  const getTotalImageCount = useCallback(() => {
    const inlineCount = editorRef.current?.querySelectorAll('.note-image-block').length ?? 0;
    return inlineCount + images.length;
  }, [images.length]);

  const insertImageBlocksAtSavedRange = useCallback(
    (srcs: string[]) => {
      const editor = editorRef.current;
      if (!editor || srcs.length === 0) return;

      const blocks = srcs.map((src) => createImageBlockElement(src));
      const lastBlock = blocks[blocks.length - 1];

      editor.focus();

      let range = savedRangeRef.current;
      if (!range || !editor.contains(range.commonAncestorContainer)) {
        range = null;
      }

      if (range) {
        if (!range.collapsed) {
          range.deleteContents();
        }

        // Find direct child of editor containing the cursor
        let directChild: Node | null = range.startContainer;
        while (directChild && directChild.parentNode !== editor) {
          directChild = directChild.parentNode;
        }

        if (directChild && directChild.nodeType === Node.TEXT_NODE) {
          const textNode = directChild as Text;
          const afterText = textNode.splitText(range.startOffset);
          let refNode: Node = afterText;
          blocks.forEach((blk) => {
            editor.insertBefore(blk, refNode);
          });
          if (!afterText.textContent || afterText.textContent.length === 0) {
            afterText.remove();
          }
        } else if (directChild && directChild.nodeType === Node.ELEMENT_NODE) {
          const directEl = directChild as HTMLElement;

          if (directEl.classList.contains('note-image-block')) {
            let insertAfter: Node = directEl;
            blocks.forEach((blk) => {
              editor.insertBefore(blk, insertAfter.nextSibling);
              insertAfter = blk;
            });
          } else if (directEl.tagName === 'UL' || directEl.tagName === 'OL') {
            let insertAfter: Node = directEl;
            blocks.forEach((blk) => {
              editor.insertBefore(blk, insertAfter.nextSibling);
              insertAfter = blk;
            });
          } else {
            // Split block element at cursor so text before stays above and text after stays below
            const tailRange = document.createRange();
            tailRange.setStart(range.endContainer, range.endOffset);
            tailRange.setEnd(directEl, directEl.childNodes.length);
            const tailFragment = tailRange.extractContents();

            let insertAfter: Node = directEl;
            blocks.forEach((blk) => {
              editor.insertBefore(blk, insertAfter.nextSibling);
              insertAfter = blk;
            });

            const tailHasText = Boolean(tailFragment.textContent && tailFragment.textContent.trim().length > 0);
            const tailHasElements = tailFragment.querySelectorAll('br, img, span, b, i, u, strong, em').length > 0;
            if (tailHasText || tailHasElements) {
              const tag = directEl.tagName === 'H2' || directEl.tagName === 'BLOCKQUOTE' ? directEl.tagName.toLowerCase() : 'p';
              const afterBlock = document.createElement(tag);
              afterBlock.appendChild(tailFragment);
              if (!afterBlock.textContent?.trim() && !afterBlock.querySelector('br')) {
                afterBlock.innerHTML = '<br>';
              }
              editor.insertBefore(afterBlock, lastBlock.nextSibling);
            }

            if (
              !directEl.textContent?.trim() &&
              directEl.querySelectorAll('img, .note-image-block, .note-check-item').length === 0
            ) {
              // Keep blank line above if it's not the only element or remove empty placeholder cleanly
              if (directEl.innerHTML === '') {
                directEl.innerHTML = '<br>';
              }
            }
          }
        } else {
          blocks.forEach((blk) => editor.appendChild(blk));
        }
      } else {
        blocks.forEach((blk) => editor.appendChild(blk));
      }

      // Ensure there is an editable paragraph right after the inserted image if none exists
      let nextEditable = lastBlock.nextElementSibling as HTMLElement | null;
      if (!nextEditable || nextEditable.classList.contains('note-image-block')) {
        const trailingP = document.createElement('p');
        trailingP.innerHTML = '<br>';
        editor.insertBefore(trailingP, lastBlock.nextSibling);
        nextEditable = trailingP;
      }

      // Place caret inside the element following the inserted image
      try {
        const sel = window.getSelection();
        if (sel && nextEditable) {
          const nextRange = document.createRange();
          nextRange.setStart(nextEditable, 0);
          nextRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(nextRange);
          savedRangeRef.current = nextRange.cloneRange();
        }
      } catch {
        // Ignore selection placement error
      }

      emitChange();
    },
    [emitChange]
  );

  // Window-level pointer listeners for vertical drag-and-drop image reordering
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const session = dragSessionRef.current;
      const editor = editorRef.current;
      const wrapper = editorWrapperRef.current;
      if (!session || !editor || !wrapper) return;

      const dx = e.clientX - session.startX;
      const dy = e.clientY - session.startY;

      if (!session.active) {
        if (Math.hypot(dx, dy) < 6) return;
        session.active = true;
        session.blockEl.classList.add('is-dragging');
      }

      e.preventDefault();
      setDragGhost({ src: session.imgSrc, x: e.clientX, y: e.clientY });

      // Smooth auto-scroll near viewport top/bottom while dragging
      if (e.clientY < 96) {
        window.scrollBy(0, -10);
      } else if (e.clientY > window.innerHeight - 96) {
        window.scrollBy(0, 10);
      }

      // Compute drop position among direct child nodes of editor
      const wrapperRect = wrapper.getBoundingClientRect();
      const children = Array.from(editor.childNodes).filter((node) => {
        if (node === session.blockEl) return false;
        return getChildNodeRect(node) !== null;
      });

      let insertBeforeNode: ChildNode | null = null;
      let indicatorY: number | null = null;

      for (const child of children) {
        const rect = getChildNodeRect(child);
        if (!rect) continue;
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          insertBeforeNode = child;
          indicatorY = rect.top - wrapperRect.top - 4;
          break;
        }
      }

      if (insertBeforeNode === null) {
        if (children.length > 0) {
          const lastRect = getChildNodeRect(children[children.length - 1]);
          if (lastRect) {
            indicatorY = lastRect.bottom - wrapperRect.top + 4;
          }
        } else {
          indicatorY = 8;
        }
      }

      session.insertBeforeNode = insertBeforeNode;
      setDropIndicatorTop(indicatorY);
    };

    const finishDrag = () => {
      const session = dragSessionRef.current;
      const editor = editorRef.current;
      if (!session) return;
      dragSessionRef.current = null;

      session.blockEl.classList.remove('is-dragging');
      setDragGhost(null);
      setDropIndicatorTop(null);

      if (session.active && editor) {
        const { blockEl, insertBeforeNode } = session;
        if (insertBeforeNode && insertBeforeNode !== blockEl && insertBeforeNode !== blockEl.nextSibling) {
          editor.insertBefore(blockEl, insertBeforeNode);
        } else if (insertBeforeNode === null && editor.lastChild !== blockEl) {
          editor.appendChild(blockEl);
        }

        // Ensure trailing editable paragraph if image ended up last
        if (editor.lastElementChild === blockEl) {
          const trailingP = document.createElement('p');
          trailingP.innerHTML = '<br>';
          editor.appendChild(trailingP);
        }

        emitChange();
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
    };
  }, [emitChange]);

  const handleEditorPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-action="remove-image"]')) {
      return;
    }

    const dragBtn = target.closest('[data-action="drag-image"]');
    const blockEl = target.closest('.note-image-block') as HTMLElement | null;
    if (!blockEl) return;

    const isMouseImgDrag =
      e.pointerType === 'mouse' && target.tagName === 'IMG' && blockEl.contains(target);

    if (!dragBtn && !isMouseImgDrag) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const imgEl = blockEl.querySelector('img');
    if (!imgEl?.src) return;

    if (dragBtn) {
      e.preventDefault();
    }

    dragSessionRef.current = {
      blockEl,
      imgSrc: imgEl.src,
      startX: e.clientX,
      startY: e.clientY,
      active: Boolean(dragBtn),
      insertBeforeNode: null,
    };

    if (dragBtn) {
      blockEl.classList.add('is-dragging');
      setDragGhost({ src: imgEl.src, x: e.clientX, y: e.clientY });
    }
  };

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
    saveSelection();
    const totalCount = getTotalImageCount();
    if (!isPremium && totalCount >= maxImagesAllowed) {
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
    const totalCount = getTotalImageCount();
    const remainingSlots = isPremium ? files.length : Math.max(0, maxImagesAllowed - totalCount);
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
      insertImageBlocksAtSavedRange(loaded);
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
      saveSelection();
      const totalCount = getTotalImageCount();
      if (!isPremium && totalCount >= maxImagesAllowed) {
        requestUpgrade(
          `Free plan allows ${FREE_LIMITS.maxImagesPerNote} image per note. Upgrade to Notes Premium for unlimited images.`
        );
        return;
      }
      const loaded: string[] = [];
      const limit = isPremium ? imageFiles.length : Math.max(0, maxImagesAllowed - totalCount);
      for (const file of imageFiles.slice(0, limit)) {
        try {
          loaded.push(await readAndCompressImage(file));
        } catch {
          // Ignore
        }
      }
      if (loaded.length > 0) {
        insertImageBlocksAtSavedRange(loaded);
      }
    }
  };

  const handleRemoveLegacyImage = (index: number) => {
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

    const removeBtn = target.closest('[data-action="remove-image"]');
    if (removeBtn) {
      e.preventDefault();
      e.stopPropagation();
      const block = removeBtn.closest('.note-image-block');
      if (block) {
        block.remove();
        emitChange();
      }
      return;
    }

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
      saveSelection();
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
              onMouseDown={() => saveSelection()}
              onTouchStart={() => saveSelection()}
              onClick={() => handleImageTrigger('gallery')}
              aria-label="Add image"
              title="Add image at cursor"
              className={toolbarBtnClass(false)}
            >
              <ImagePlus className="h-4 w-4" strokeWidth={2} />
            </button>

            <button
              type="button"
              onMouseDown={() => saveSelection()}
              onTouchStart={() => saveSelection()}
              onClick={() => handleImageTrigger('camera')}
              aria-label="Take photo"
              title="Take photo at cursor"
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

      {/* Distraction-free writing & inline media area */}
      <div className="flex-1 px-4 sm:px-8 pt-6 pb-20">
        <input
          type="text"
          value={title}
          onChange={(e) => onChangeTitle(e.target.value)}
          placeholder="Note title"
          aria-label="Note title"
          className="w-full bg-transparent text-2xl sm:text-[28px] font-bold tracking-tight text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none"
        />

        <div ref={editorWrapperRef} className="relative mt-4">
          {dropIndicatorTop !== null && (
            <div
              aria-hidden="true"
              style={{ top: `${dropIndicatorTop}px` }}
              className="pointer-events-none absolute left-0 right-0 z-30 flex items-center"
            >
              <span className="h-2.5 w-2.5 -ml-1 rounded-full bg-[var(--accent-primary)] shrink-0" />
              <span className="h-0.5 flex-1 bg-[var(--accent-primary)] rounded-full" />
              <span className="h-2.5 w-2.5 -mr-1 rounded-full bg-[var(--accent-primary)] shrink-0" />
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Start writing..."
            onInput={() => {
              saveSelection();
              emitChange();
            }}
            onKeyUp={() => {
              saveSelection();
              updateToolbarState();
            }}
            onMouseUp={() => {
              saveSelection();
              updateToolbarState();
            }}
            onTouchEnd={() => {
              saveSelection();
              updateToolbarState();
            }}
            onBlur={() => saveSelection()}
            onPointerDown={handleEditorPointerDown}
            onClick={handleEditorClick}
            onPaste={handlePaste}
            aria-label="Note content"
            className="note-content min-h-[260px] text-[15.5px] sm:text-base text-[var(--text-primary)] focus:outline-none"
          />
        </div>

        {/* Legacy bottom attachments fallback (if any older note has note.images) */}
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
                  onClick={() => handleRemoveLegacyImage(idx)}
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

      {/* Floating thumbnail ghost while dragging an inline image */}
      {dragGhost && (
        <div
          aria-hidden="true"
          style={{
            left: `${dragGhost.x}px`,
            top: `${dragGhost.y}px`,
            transform: 'translate(-50%, -65%)',
          }}
          className="pointer-events-none fixed z-50 h-20 w-28 overflow-hidden rounded-xl border-2 border-[var(--accent-primary)] bg-[var(--bg-card)] opacity-90"
        >
          <img
            src={dragGhost.src}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}
