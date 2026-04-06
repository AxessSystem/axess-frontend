import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link as LinkIcon,
  Heading1, Heading2, Undo, Redo
} from 'lucide-react';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        style: 'min-height: 180px; padding: 12px; outline: none; direction: rtl; text-align: right;',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = value || '';
    if (editor.getHTML() === next) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, value]);

  if (!editor) return null;

  const ToolbarBtn = ({ onClick, active, children, title }) => (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      style={{
        width: 32, height: 32, borderRadius: 6, border: 'none',
        background: active ? 'rgba(0,195,122,0.2)' : 'transparent',
        color: active ? '#00C37A' : 'rgba(255,255,255,0.7)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
  );

  return (
    <div style={{
      position: 'relative',
      border: '1px solid var(--glass-border)', borderRadius: 10,
      overflow: 'hidden', background: 'var(--card)',
    }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 2, padding: '6px 8px',
        borderBottom: '1px solid var(--glass-border)',
        background: 'var(--glass)',
      }}>
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="בטל">
          <Undo size={15} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="חזור">
          <Redo size={15} />
        </ToolbarBtn>
        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="כותרת 1"
        >
          <Heading1 size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="כותרת 2"
        >
          <Heading2 size={15} />
        </ToolbarBtn>
        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="מודגש"
        >
          <Bold size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="נטוי"
        >
          <Italic size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="קו תחתון"
        >
          <UnderlineIcon size={15} />
        </ToolbarBtn>
        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="יישור לימין"
        >
          <AlignRight size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="מרכז"
        >
          <AlignCenter size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="יישור לשמאל"
        >
          <AlignLeft size={15} />
        </ToolbarBtn>
        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="רשימה"
        >
          <List size={15} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="רשימה ממוספרת"
        >
          <ListOrdered size={15} />
        </ToolbarBtn>
        <Divider />

        <ToolbarBtn
          onClick={() => {
            const url = window.prompt('הכנס URL:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          active={editor.isActive('link')}
          title="הוסף קישור"
        >
          <LinkIcon size={15} />
        </ToolbarBtn>
      </div>

      <div style={{ direction: 'rtl', position: 'relative' }}>
        <EditorContent editor={editor} />
        {!editor.getText().trim() && placeholder && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            color: 'rgba(255,255,255,0.3)', fontSize: 14,
            pointerEvents: 'none',
          }}
          >
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
