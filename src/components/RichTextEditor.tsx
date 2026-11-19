import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bold,
  Camera,
  Check,
  CheckSquare,
  Heading2,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Lock,
  Mic,
  MicOff,
  Minus,
  PenTool,
  Plus,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Underline,
  Undo2,
  X,
} from 'lucide-react';
import { useBackHandler, useNotes } from '../context/NotesContext';
import { FREE_LIMITS } from '../types/notes';
import { readAndCompressImage, stripHtmlToText } from '../utils/noteHelpers';
import { SketchModal } from './SketchModal';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

const QUICK_TEMPLATES = [
  {
    id: 'meeting',
    label: 'Meeting Notes',
    title: 'Meeting Notes',
    html: '<p><strong>Date:</strong> </p><p><strong>Agenda:</strong></p><ul><li></li></ul><p><strong>Key Takeaways:</strong></p><ul><li></li></ul>',
  },
  {
    id: 'study',
    label: 'Study Notes',
    title: 'Study Notes',
    html: '<p><strong>Topic:</strong> </p><p><strong>Key Points:</strong></p><ul><li></li></ul><p><strong>Summary:</strong></p><p><br></p>',
  },
  {
    id: 'grocery',
    label: 'Grocery List',
    title: 'Shopping List',
    html: '<table class="note-table"><thead><tr><th>Item</th><th>Qty / Note</th></tr></thead><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>',
  },
];

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
  const { isPremium, maxImagesAllowed, requestUpgrade, showToast } = useNotes();

  const editorWrapperRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const insertMenuRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
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
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);
  const [sketchOpen, setSketchOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [sizeSliderOpen, setSizeSliderOpen] = useState(false);
  const [activeFontSize, setActiveFontSize] = useState(18);
  const activeSizeGroupRef = useRef<string | null>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const isSlidingRef = useRef(false);

  const MIN_TEXT_SIZE = 10;
  const MAX_TEXT_SIZE = 42;

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
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

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (insertMenuRef.current && !insertMenuRef.current.contains(e.target as Node)) {
        setInsertMenuOpen(false);
      }
    };
    if (insertMenuOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [insertMenuOpen]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup stop errors
      }
    };
  }, []);

  const updateToolbarState = useCallback(() => {
    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
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

  const handleToggleHighlight = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const currentBg = document.queryCommandValue('hiliteColor');
    const isHighlighted =
      currentBg &&
      currentBg !== 'transparent' &&
      currentBg !== 'rgba(0, 0, 0, 0)' &&
      currentBg !== 'rgb(255, 255, 255)';
    document.execCommand('hiliteColor', false, isHighlighted ? 'transparent' : '#FFF1B8');
    emitChange();
  };

  const restoreSavedRange = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (!sel) return;
    if (savedRangeRef.current && editor.contains(savedRangeRef.current.commonAncestorContainer)) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  }, []);

  const handleInsertDivider = () => {
    setInsertMenuOpen(false);
    restoreSavedRange();
    document.execCommand('insertHTML', false, '<hr /><p><br></p>');
    emitChange();
  };

  const handleInsertTable = () => {
    setInsertMenuOpen(false);
    restoreSavedRange();
    const tableHtml =
      '<table class="note-table"><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead>' +
      '<tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>';
    document.execCommand('insertHTML', false, tableHtml);
    emitChange();
  };

  const handleOpenLinkModal = () => {
    saveSelection();
    setInsertMenuOpen(false);
    const sel = window.getSelection();
    const selectedText = sel && editorRef.current?.contains(sel.anchorNode) ? sel.toString() : '';
    setLinkText(selectedText);
    setLinkUrl('');
    setLinkModalOpen(true);
  };

  const handleConfirmLink = (e: React.FormEvent) => {
    e.preventDefault();
    const rawUrl = linkUrl.trim();
    if (!rawUrl) return;
    const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const displayText = linkText.trim() || rawUrl;

    setLinkModalOpen(false);
    restoreSavedRange();

    const safeHref = normalizedUrl.replace(/"/g, '&quot;');
    const safeLabel = displayText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    document.execCommand(
      'insertHTML',
      false,
      `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>&nbsp;`
    );
    emitChange();
  };

  const handleOpenSketch = () => {
    saveSelection();
    setInsertMenuOpen(false);
    const totalCount = getTotalImageCount();
    if (!isPremium && totalCount >= maxImagesAllowed) {
      requestUpgrade(
        `Free plan allows ${FREE_LIMITS.maxImagesPerNote} image or sketch per note. Upgrade to Notes Premium for unlimited media.`
      );
      return;
    }
    setSketchOpen(true);
  };

  const handleToggleVoice = (overrideLang?: 'bn-BD' | 'en-US') => {
    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      showToast('Voice typing is not supported in this browser');
      return;
    }

    if (isListening && !overrideLang) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore stop errors
      }
      setIsListening(false);
      return;
    }

    if (isListening && overrideLang) {
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore stop errors
      }
    }

    const activeLang = overrideLang || speechLang;
    if (overrideLang) setSpeechLang(overrideLang);

    saveSelection();
    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = activeLang;

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += `${event.results[i][0].transcript} `;
        }
      }
      if (transcript.trim() && editorRef.current) {
        restoreSavedRange();
        document.execCommand('insertText', false, transcript);
        saveSelection();
        emitChange();
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      showToast('Could not capture voice input');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setInsertMenuOpen(false);
    } catch {
      setIsListening(false);
      showToast('Microphone permission unavailable');
    }
  };

  const handleApplyTemplate = (tpl: (typeof QUICK_TEMPLATES)[number]) => {
    if (!editorRef.current) return;
    onChangeTitle(tpl.title);
    editorRef.current.innerHTML = tpl.html;
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

  const closeSizeSlider = useCallback(() => {
    setSizeSliderOpen(false);
    activeSizeGroupRef.current = null;
  }, []);

  useBackHandler(sizeSliderOpen, closeSizeSlider);
  useBackHandler(linkModalOpen, () => setLinkModalOpen(false));

  const applyFontSizeToActiveGroup = useCallback((nextSize: number, commitHistory: boolean) => {
    const editor = editorRef.current;
    const groupId = activeSizeGroupRef.current;
    if (!editor || !groupId) return;

    const clamped = Math.max(MIN_TEXT_SIZE, Math.min(MAX_TEXT_SIZE, Math.round(nextSize)));
    setActiveFontSize(clamped);

    const targets = editor.querySelectorAll<HTMLElement>(`[data-size-group="${groupId}"]`);
    targets.forEach((el) => {
      el.style.fontSize = `${clamped}px`;
      el.style.lineHeight = '1.35';
    });

    if (commitHistory) {
      emitChange();
    }
  }, [emitChange]);

  const updateSliderFromClientX = useCallback(
    (clientX: number, commitHistory: boolean) => {
      const track = sliderTrackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const nextSize = Math.round(MIN_TEXT_SIZE + ratio * (MAX_TEXT_SIZE - MIN_TEXT_SIZE));
      applyFontSizeToActiveGroup(nextSize, commitHistory);
    },
    [applyFontSizeToActiveGroup]
  );

  const handleOpenTextSizeSlider = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const sel = window.getSelection();
    let range: Range | null = null;
    if (sel && sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      range = sel.getRangeAt(0);
    } else if (
      savedRangeRef.current &&
      editor.contains(savedRangeRef.current.commonAncestorContainer)
    ) {
      range = savedRangeRef.current;
    }

    if (!range || range.collapsed || !range.toString().trim()) {
      if (sizeSliderOpen) {
        closeSizeSlider();
      } else {
        showToast('Select text first to resize');
      }
      return;
    }

    // Measure current computed font-size at selection start
    let startEl: HTMLElement | null =
      range.startContainer.nodeType === Node.ELEMENT_NODE
        ? (range.startContainer as HTMLElement)
        : range.startContainer.parentElement;
    if (!startEl || !editor.contains(startEl)) {
      startEl = editor;
    }
    const existingSpan = startEl.closest('.note-sized-text') as HTMLElement | null;
    const rawSize = parseFloat(
      existingSpan?.style.fontSize || window.getComputedStyle(startEl).fontSize || '16'
    );
    const initialSize = Math.max(MIN_TEXT_SIZE, Math.min(MAX_TEXT_SIZE, Math.round(rawSize || 16)));

    editor.focus();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }

    const groupId = `fs_${Date.now()}`;
    document.execCommand('fontSize', false, '7');

    const createdFonts = Array.from(editor.querySelectorAll('font[size="7"]'));
    if (createdFonts.length === 0) {
      showToast('Select text first to resize');
      return;
    }

    const wrappedSpans: HTMLSpanElement[] = [];
    createdFonts.forEach((fontEl) => {
      const span = document.createElement('span');
      span.className = 'note-sized-text';
      span.setAttribute('data-size-group', groupId);
      span.style.fontSize = `${initialSize}px`;
      span.style.lineHeight = '1.35';
      while (fontEl.firstChild) {
        span.appendChild(fontEl.firstChild);
      }

      // Unwrap any nested sized spans inside the new selection wrapper
      span.querySelectorAll('.note-sized-text').forEach((nested) => {
        const parent = nested.parentNode;
        if (!parent) return;
        while (nested.firstChild) {
          parent.insertBefore(nested.firstChild, nested);
        }
        parent.removeChild(nested);
      });

      fontEl.parentNode?.replaceChild(span, fontEl);

      // If parent is an old .note-sized-text containing only this new span, replace the parent cleanly
      const parentEl = span.parentElement;
      if (
        parentEl &&
        parentEl.classList.contains('note-sized-text') &&
        parentEl.childNodes.length === 1
      ) {
        parentEl.parentNode?.replaceChild(span, parentEl);
      }

      wrappedSpans.push(span);
    });

    if (sel && wrappedSpans.length > 0) {
      const nextRange = document.createRange();
      nextRange.setStartBefore(wrappedSpans[0]);
      nextRange.setEndAfter(wrappedSpans[wrappedSpans.length - 1]);
      sel.removeAllRanges();
      sel.addRange(nextRange);
      savedRangeRef.current = nextRange.cloneRange();
    }

    activeSizeGroupRef.current = groupId;
    setActiveFontSize(initialSize);
    setSizeSliderOpen(true);
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
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar min-w-0">
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
                handleFormat('strikeThrough');
              }}
              aria-label="Strikethrough"
              title="Strikethrough"
              className={toolbarBtnClass(activeFormats.strikeThrough)}
            >
              <Strikethrough className="h-4 w-4" strokeWidth={2} />
            </button>

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleToggleHighlight();
              }}
              aria-label="Highlight text"
              title="Highlight"
              className={toolbarBtnClass(false)}
            >
              <Highlighter className="h-4 w-4" strokeWidth={2} />
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

            <div className="mx-1 h-4 w-px bg-[var(--divider)] shrink-0" />

            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                handleOpenTextSizeSlider();
              }}
              aria-label="Resize selected text"
              title="Resize selected text"
              className={toolbarBtnClass(sizeSliderOpen)}
            >
              <Heading2 className="h-4 w-4" strokeWidth={2} />
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

            <div className="mx-1 h-4 w-px bg-[var(--divider)] shrink-0" />

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

            <button
              type="button"
              onMouseDown={() => saveSelection()}
              onTouchStart={() => saveSelection()}
              onClick={() => handleToggleVoice()}
              aria-label={isListening ? 'Stop voice typing' : 'Voice typing'}
              title={isListening ? 'Stop listening' : `Voice typing (${speechLang === 'bn-BD' ? 'বাংলা' : 'EN'})`}
              className={toolbarBtnClass(isListening)}
            >
              {isListening ? (
                <MicOff className="h-4 w-4 text-[#E45B5B]" strokeWidth={2} />
              ) : (
                <Mic className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            {/* + Insert Extra Tools Menu */}
            <div className="relative" ref={insertMenuRef}>
              <button
                type="button"
                onMouseDown={() => saveSelection()}
                onTouchStart={() => saveSelection()}
                onClick={() => setInsertMenuOpen((v) => !v)}
                aria-label="Insert more tools"
                title="Insert table, link, divider, sketch"
                className={toolbarBtnClass(insertMenuOpen)}
              >
                <Plus className="h-4 w-4" strokeWidth={2.2} />
              </button>

              {insertMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] py-1.5 z-40">
                  <button
                    type="button"
                    onClick={handleInsertTable}
                    className="flex w-full min-h-[40px] items-center gap-2.5 px-3.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                  >
                    <Table2 className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                    Simple Table
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenLinkModal}
                    className="flex w-full min-h-[40px] items-center gap-2.5 px-3.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                  >
                    <Link2 className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                    Insert Link
                  </button>

                  <button
                    type="button"
                    onClick={handleInsertDivider}
                    className="flex w-full min-h-[40px] items-center gap-2.5 px-3.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                  >
                    <Minus className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                    Divider Line
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenSketch}
                    className="flex w-full min-h-[40px] items-center gap-2.5 px-3.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                  >
                    <PenTool className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                    Quick Sketch
                  </button>

                  <div className="my-1 h-px bg-[var(--divider)]" />

                  <button
                    type="button"
                    onClick={() => handleToggleVoice(speechLang === 'bn-BD' ? 'en-US' : 'bn-BD')}
                    className="flex w-full min-h-[40px] items-center justify-between px-3.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <Mic className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.85} />
                      Voice Language
                    </span>
                    <span className="text-xs font-semibold text-[var(--accent-primary)]">
                      {speechLang === 'bn-BD' ? 'বাংলা' : 'EN'}
                    </span>
                  </button>
                </div>
              )}
            </div>

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

        {sizeSliderOpen && (
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--divider)] px-3.5 py-2">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] shrink-0">
              Size
            </span>

            <div
              ref={sliderTrackRef}
              role="slider"
              aria-label="Selected text font size"
              aria-valuemin={MIN_TEXT_SIZE}
              aria-valuemax={MAX_TEXT_SIZE}
              aria-valuenow={activeFontSize}
              tabIndex={0}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isSlidingRef.current = true;
                e.currentTarget.setPointerCapture(e.pointerId);
                updateSliderFromClientX(e.clientX, false);
              }}
              onPointerMove={(e) => {
                if (!isSlidingRef.current) return;
                e.preventDefault();
                updateSliderFromClientX(e.clientX, false);
              }}
              onPointerUp={(e) => {
                if (!isSlidingRef.current) return;
                isSlidingRef.current = false;
                updateSliderFromClientX(e.clientX, true);
              }}
              onPointerCancel={() => {
                if (!isSlidingRef.current) return;
                isSlidingRef.current = false;
                emitChange();
              }}
              className="relative flex-1 h-8 flex items-center touch-none cursor-pointer select-none"
            >
              <div className="w-full h-1.5 rounded-full bg-[var(--divider)] overflow-hidden">
                <div
                  className="h-full bg-[var(--accent-primary)] rounded-full"
                  style={{
                    width: `${((activeFontSize - MIN_TEXT_SIZE) / (MAX_TEXT_SIZE - MIN_TEXT_SIZE)) * 100}%`,
                  }}
                />
              </div>
              <div
                style={{
                  left: `${((activeFontSize - MIN_TEXT_SIZE) / (MAX_TEXT_SIZE - MIN_TEXT_SIZE)) * 100}%`,
                }}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-[var(--accent-primary)] border-2 border-white dark:border-[#171717] shadow-sm pointer-events-none"
              />
            </div>

            <span className="min-w-[38px] text-right text-xs font-semibold tabular-nums text-[var(--text-primary)] shrink-0">
              {activeFontSize}px
            </span>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={closeSizeSlider}
              aria-label="Done resizing"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-primary)] hover:opacity-85 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
            </button>
          </div>
        )}

        {isListening && (
          <div className="mt-2 flex items-center justify-between rounded-xl bg-[var(--accent-soft)] px-3 py-1.5 text-xs">
            <span className="font-medium text-[var(--text-primary)]">
              Listening ({speechLang === 'bn-BD' ? 'বাংলা' : 'English'})… Speak now
            </span>
            <button
              type="button"
              onClick={() => handleToggleVoice()}
              className="font-semibold text-[#E45B5B] cursor-pointer"
            >
              Stop
            </button>
          </div>
        )}
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
            className="note-content min-h-[260px] text-[var(--text-primary)] focus:outline-none"
          />
        </div>

        {/* Optional Quick Templates (only visible when note is completely empty) */}
        {!title.trim() &&
          !stripHtmlToText(content) &&
          !content.includes('note-image-block') &&
          !content.includes('note-table') && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {QUICK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl)}
                  className="min-h-[34px] rounded-xl bg-[var(--bg-card)] border border-[var(--divider)] px-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/60 transition-colors cursor-pointer"
                >
                  + {tpl.label}
                </button>
              ))}
            </div>
          )}

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

      {/* Insert Link Modal */}
      {linkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLinkModalOpen(false)}
        >
          <form
            onSubmit={handleConfirmLink}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-[var(--bg-card)] border border-[var(--divider)] p-6 space-y-3"
          >
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Insert Link</h3>
            <input
              type="text"
              autoFocus
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Paste URL (https://...)"
              aria-label="Link URL"
              className="w-full min-h-[44px] rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Display text (optional)"
              aria-label="Link text"
              className="w-full min-h-[44px] rounded-xl bg-[var(--bg-canvas)] border border-[var(--divider)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)]"
            />
            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="flex-1 min-h-[44px] rounded-full bg-[var(--bg-subtle)] text-sm font-semibold text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!linkUrl.trim()}
                className="flex-1 min-h-[44px] rounded-full bg-[var(--text-primary)] dark:bg-[var(--accent-primary)] text-sm font-semibold text-[var(--bg-card)] dark:text-[#171717] disabled:opacity-40 cursor-pointer"
              >
                Insert
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick Sketch Modal */}
      <SketchModal
        open={sketchOpen}
        onInsert={(dataUrl) => insertImageBlocksAtSavedRange([dataUrl])}
        onClose={() => setSketchOpen(false)}
      />
    </div>
  );
}
