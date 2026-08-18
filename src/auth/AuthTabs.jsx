const TABS = [
  { id: 'signin', label: 'Sign In' },
  { id: 'signup', label: 'Create Account' },
];

export default function AuthTabs({ active, onChange, disabled, panelId }) {
  const activeIndex = Math.max(0, TABS.findIndex((tab) => tab.id === active));

  const handleKeyDown = (event) => {
    let next = null;
    if (event.key === 'ArrowRight') next = Math.min(activeIndex + 1, TABS.length - 1);
    else if (event.key === 'ArrowLeft') next = Math.max(activeIndex - 1, 0);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = TABS.length - 1;
    if (next !== null && next !== activeIndex) {
      event.preventDefault();
      onChange(TABS[next].id);
      document.getElementById(`auth-tab-${TABS[next].id}`)?.focus();
    }
  };

  return (
    <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`auth-tab-${tab.id}`}
          className="auth-tab"
          aria-selected={active === tab.id}
          aria-controls={panelId}
          tabIndex={active === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}