import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useEffect, useState, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';
import {
  Bold, Italic, Underline as UnderlineIcon,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link as LinkIcon,
  Heading1, Heading2, Undo, Redo,
  Smile, Highlighter, Eraser, Image as ImageIcon,
  Palette,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.axess.pro';

export default function RichTextEditor({ value, onChange, placeholder, authHeaders }) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const fileInputRef = useRef(null);

  const COLORS = [
    '#ffffff', '#00C37A', '#3B82F6', '#F59E0B', '#EF4444',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316',
  ];

  const HIGHLIGHTS = [
    '#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca',
    '#e9d5ff', '#fed7aa', '#cffafe',
  ];

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        style: 'min-height: 200px; padding: 14px; outline: none; direction: rtl; text-align: right; font-size: 14px; line-height: 1.7;',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = value || '';
    if (next === editor.getHTML()) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  const Btn = ({ onClick, active, title, children, style = {} }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
        background: active ? 'rgba(0,195,122,0.2)' : 'transparent',
        color: active ? '#00C37A' : 'rgba(255,255,255,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', ...style,
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );

  const Sep = () => <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />;

  const uploadImage = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await fetch(`${API_BASE}/upload/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(authHeaders?.() || {}) },
          body: JSON.stringify({ image: e.target.result, folder: 'events/description' }),
        });
        const data = await res.json();
        if (data.url) editor.chain().focus().setImage({ src: data.url }).run();
      } catch (err) {
        console.error('upload error:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      border: '1px solid var(--glass-border)', borderRadius: 10, overflow: 'visible', background: 'var(--card)', position: 'relative',
    }}
    >
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 1, padding: '6px 8px',
        borderBottom: '1px solid var(--glass-border)', background: 'var(--glass)',
        borderRadius: '10px 10px 0 0', position: 'sticky', top: 0, zIndex: 10,
      }}
      >
        <Btn onClick={() => editor.chain().focus().undo().run()} title="בטל"><Undo size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="חזור"><Redo size={14} /></Btn>
        <Sep />

        <Btn
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="כותרת 1"
        >
          <Heading1 size={14} />
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="כותרת 2"
        >
          <Heading2 size={14} />
        </Btn>
        <Sep />

        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="מודגש"><Bold size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="נטוי"><Italic size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="קו תחתון"><UnderlineIcon size={14} /></Btn>
        <Sep />

        <div style={{ position: 'relative' }}>
          <Btn
            onClick={() => { setShowColorPicker((p) => !p); setShowHighlightPicker(false); setShowEmoji(false); }}
            active={showColorPicker}
            title="צבע טקסט"
          >
            <Palette size={14} />
          </Btn>
          {showColorPicker && (
            <div style={{
              position: 'absolute', top: 36, right: 0, zIndex: 100, background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 8, display: 'flex', flexWrap: 'wrap', gap: 4, width: 130,
            }}
            >
              {COLORS.map((c) => (
                <div
                  key={c}
                  onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                  style={{
                    width: 20, height: 20, borderRadius: 4, background: c, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)',
                  }}
                />
              ))}
              <div
                onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                style={{
                  width: 20, height: 20, borderRadius: 4, background: 'transparent', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                }}
              >
                ✕
              </div>
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }}>
          <Btn
            onClick={() => { setShowHighlightPicker((p) => !p); setShowColorPicker(false); setShowEmoji(false); }}
            active={showHighlightPicker}
            title="סמן טקסט"
          >
            <Highlighter size={14} />
          </Btn>
          {showHighlightPicker && (
            <div style={{
              position: 'absolute', top: 36, right: 0, zIndex: 100, background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: 8, display: 'flex', flexWrap: 'wrap', gap: 4, width: 110,
            }}
            >
              {HIGHLIGHTS.map((c) => (
                <div
                  key={c}
                  onClick={() => { editor.chain().focus().setHighlight({ color: c }).run(); setShowHighlightPicker(false); }}
                  style={{
                    width: 20, height: 20, borderRadius: 4, background: c, cursor: 'pointer', border: '1px solid rgba(0,0,0,0.2)',
                  }}
                />
              ))}
              <div
                onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false); }}
                style={{
                  width: 20, height: 20, borderRadius: 4, background: 'transparent', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                }}
              >
                ✕
              </div>
            </div>
          )}
        </div>

        <Btn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="נקה עיצוב">
          <Eraser size={14} />
        </Btn>
        <Sep />

        <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="ימין"><AlignRight size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="מרכז"><AlignCenter size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="שמאל"><AlignLeft size={14} /></Btn>
        <Sep />

        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="רשימה"><List size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="ממוספרת"><ListOrdered size={14} /></Btn>
        <Sep />

        <Btn
          onClick={() => {
            const url = window.prompt('הכנס URL:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          active={editor.isActive('link')}
          title="קישור"
        >
          <LinkIcon size={14} />
        </Btn>

        <Btn onClick={() => fileInputRef.current?.click()} title="הוסף תמונה">
          <ImageIcon size={14} />
        </Btn>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files[0]) uploadImage(e.target.files[0]); }}
        />

        <div style={{ position: 'relative' }}>
          <Btn
            onClick={() => { setShowEmoji((p) => !p); setShowColorPicker(false); setShowHighlightPicker(false); }}
            active={showEmoji}
            title="אמוג'י"
          >
            <Smile size={14} />
          </Btn>
          {showEmoji && (
            <div style={{ position: 'absolute', top: 36, left: 0, zIndex: 100 }}>
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  editor.chain().focus().insertContent(emojiData.emoji).run();
                  setShowEmoji(false);
                }}
                theme="dark"
                searchPlaceHolder="חפש אמוג'י..."
                width={280}
                height={350}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ direction: 'rtl', position: 'relative' }}>
        <EditorContent editor={editor} />
        {!editor.getText() && placeholder && (
          <div style={{
            position: 'absolute', top: 14, right: 14, color: 'rgba(255,255,255,0.25)', fontSize: 14, pointerEvents: 'none',
          }}
          >
            {placeholder}
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', padding: '8px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--v2-gray-400)', alignSelf: 'center', marginLeft: 4 }}>תבנית:</span>
        {[
          { label: '✏️ ללא תבנית', content: '' },
          { label: '🎉 מסיבה', content: '<h2>🎉 פרטי האירוע</h2><p><strong>📅 תאריך:</strong> </p><p><strong>🕐 שעה:</strong> </p><p><strong>📍 מיקום:</strong> </p><hr/><h2>🎧 ליין-אפ</h2><p></p><hr/><h2>🎟️ כרטיסים</h2><p></p><hr/><h2>⚠️ הנחיות</h2><p>גיל מינימלי: 18+</p>' },
          { label: '🎤 הופעה', content: '<h2>🎤 על האמן</h2><p></p><hr/><h2>📅 פרטי ההופעה</h2><p><strong>תאריך:</strong> </p><p><strong>שעה:</strong> </p><p><strong>מיקום:</strong> </p><hr/><h2>🎟️ כרטיסים</h2><p></p>' },
          { label: '🏢 עסקי', content: '<h2>אודות האירוע</h2><p></p><hr/><h2>📋 סדר יום</h2><p></p><hr/><h2>📍 מיקום ופרטים</h2><p></p><hr/><h2>🎟️ הרשמה</h2><p></p>' },
          { label: '💒 חתונה', content: '<h2>💒 אנחנו מתחתנים!</h2><p></p><hr/><h2>📅 פרטי האירוע</h2><p><strong>תאריך:</strong> </p><p><strong>שעה:</strong> </p><p><strong>מקום:</strong> </p><hr/><h2>📍 הגעה</h2><p></p>' },
        ].map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => editor.chain().focus().setContent(t.content).run()}
            style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 12, border: '1px solid var(--glass-border)', background: 'var(--glass)', color: 'var(--text)', cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
