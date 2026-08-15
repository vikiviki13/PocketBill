import { Children, cloneElement, isValidElement, useEffect, useId } from 'react';

function labelFirstControl(children, controlId, hintId) {
  let labelled = false;

  const visit = (child) => {
    if (!isValidElement(child)) return child;
    if (!labelled && typeof child.type === 'string' && ['input', 'select', 'textarea'].includes(child.type)) {
      labelled = true;
      return cloneElement(child, {
        id: controlId,
        ...(hintId ? { 'aria-describedby': hintId } : {}),
      });
    }
    if (child.props.children) {
      return cloneElement(child, {
        children: Children.map(child.props.children, visit),
      });
    }
    return child;
  };

  return Children.map(children, visit);
}

export function Icon({ name, size = 20 }) {
  const paths = {
    back: <path d="m15 18-6-6 6-6" />,
    settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" /><circle cx="12" cy="12" r="3" /></>,
    search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></>,
    copy: <><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>,
    check: <path d="m20 6-11 11-5-5" />,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    ban: <><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></>,
    share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4" /><path d="m15.4 6.5-6.8 4" /></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></>,
    receipt: <><path d="M4 2v20l2-2 2 2 2-2 2 2 2-2 2 2 2-2 2 2V2l-2 2-2-2-2 2-2-2-2 2-2-2-2 2Z" /><path d="M16 8h-6" /><path d="M16 12h-6" /><path d="M13 16h-3" /></>,
    close: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.receipt}
    </svg>
  );
}

export function Topbar({ title, onBack, action }) {
  return (
    <header className="topbar">
      {onBack && <button className="icon-btn" type="button" onClick={onBack} aria-label="Go back"><Icon name="back" /></button>}
      <h1>{title}</h1>
      <div className="topbar-spacer" />
      {action}
    </header>
  );
}

export function Field({ label, hint, className = '', children }) {
  const controlId = useId();
  const hintId = hint ? `${controlId}-hint` : undefined;
  const content = label ? labelFirstControl(children, controlId, hintId) : children;

  return (
    <div className={`field ${className}`}>
      {label && <label className="section-label field-label" htmlFor={controlId}>{label}</label>}
      {content}
      {hint && <div className="hint" id={hintId}>{hint}</div>}
    </div>
  );
}

export function BottomSheet({ open, title, subtitle, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <>
      <button className={`sheet-backdrop ${open ? 'show' : ''}`} type="button" onClick={onClose} aria-label="Close dialog" tabIndex={open ? 0 : -1} />
      <section className={`sheet ${open ? 'show' : ''}`} role="dialog" aria-modal="true" aria-hidden={!open} aria-label={title || 'Dialog'}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-btn ghost" type="button" onClick={onClose} aria-label="Close dialog"><Icon name="close" size={18} /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </section>
    </>
  );
}

export function Toast({ message }) {
  return <div className={`toast ${message ? 'show' : ''}`} role="status" aria-live="polite">{message}</div>;
}

export function StickyFooter({ children, className = '' }) {
  return <footer className={`sticky-footer ${className}`}>{children}</footer>;
}
