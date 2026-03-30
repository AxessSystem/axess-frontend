import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = 'בחר...', 
  style = {},
  disabled = false,
  light = false,
  id,
  className,
  ...rest
}) => {
  const ariaLabel = rest['aria-label'];
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);

  // סגור בלחיצה מחוץ
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  const selected = options.find(o => String(o.value) === String(value));
  const textColor = light ? '#0a1628' : 'var(--text)';
  const borderCss = `1px solid ${light ? '#e5e7eb' : 'var(--glass-border)'}`;
  const mutedColor = light ? '#64748b' : 'var(--v2-gray-400)';
  const triggerBg = light ? '#fff' : (disabled ? 'var(--glass)' : 'var(--card)');
  const { width: styleWidth, ...triggerExtra } = style || {};
  const wrapWidth = styleWidth ?? '100%';

  const triggerStyle = {
    padding: '8px 12px',
    borderRadius: 8,
    border: borderCss,
    background: light ? '#fff' : triggerBg,
    color: selected ? textColor : mutedColor,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 14,
    fontFamily: 'inherit',
    userSelect: 'none',
    opacity: disabled ? 0.6 : 1,
    ...triggerExtra,
    ...(light ? { background: '#fff', border: borderCss, color: selected ? textColor : mutedColor } : {}),
  };

  return (
    <div ref={wrapRef} id={id} className={className} aria-label={ariaLabel} style={{ position: 'relative', width: wrapWidth }}>
      {/* כפתור */}
      <div
        ref={triggerRef}
        onClick={() => !disabled && setOpen(!open)}
        style={triggerStyle}
      >
        <span>{selected?.label || placeholder}</span>
        <ChevronDown 
          size={16} 
          style={{ 
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: mutedColor,
            flexShrink: 0
          }} 
        />
      </div>

      {/* רשימה נפתחת */}
      {open && (
        <div style={{
          position: 'fixed',
          top: dropdownPos.top - window.scrollY,
          left: dropdownPos.left - window.scrollX,
          width: Math.max(dropdownPos.width, 160),
          zIndex: 9999,
          background: '#1e2130',
          color: textColor,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          maxHeight: 220,
          overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {options.length === 0 && (
            <div style={{ padding: '10px 12px', color: mutedColor, fontSize: 13 }}>
              אין אפשרויות
            </div>
          )}
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: '9px 12px',
                cursor: 'pointer',
                fontSize: 14,
                background: String(opt.value) === String(value) ? 'var(--primary)' : 'transparent',
                color: String(opt.value) === String(value) ? '#fff' : textColor,
                transition: 'background 0.1s'
              }}
              onMouseEnter={e => {
                if (String(opt.value) !== String(value)) {
                  e.currentTarget.style.background = 'rgba(0,195,122,0.15)';
                  e.currentTarget.style.color = '#00C37A';
                }
              }}
              onMouseLeave={e => {
                if (String(opt.value) !== String(value)) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = textColor;
                }
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
