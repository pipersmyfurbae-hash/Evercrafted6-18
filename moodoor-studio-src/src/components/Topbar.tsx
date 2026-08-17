import type { ReactNode } from 'react';

export type Step = 'inventory' | 'brief' | 'compose' | 'prompts';

/**
 * The nav is the pipeline, in the order the work actually happens: load the
 * stock, write a brief, compose render prompts for the recipes it produced,
 * then browse the prompts you saved. Numbering them is the whole point — an
 * operator who has never seen the tool should be able to read the top bar and
 * know what comes next.
 */
const STEPS: { step: Step; label: string; href: string }[] = [
  { step: 'inventory', label: 'Inventory', href: '#/inventory' },
  { step: 'brief', label: 'Brief', href: '#/brief-generator' },
  { step: 'compose', label: 'Compose', href: '#/prompt-library/compose' },
  { step: 'prompts', label: 'Prompts', href: '#/prompt-library' },
];

export interface TopbarProps {
  /** Which pipeline stage this masthead sits above — drives the active step. */
  step: Step;
  badge: string;
  /** The pipeline stage line, hidden on narrow viewports. */
  subtitle: string;
  /** True once an API key is stored; the Settings pill warns while it isn't. */
  hasKey: boolean;
  onOpenSettings: () => void;
  /** Page-specific controls, rendered before Settings. */
  children?: ReactNode;
}

export default function Topbar({
  step,
  badge,
  subtitle,
  hasKey,
  onOpenSettings,
  children,
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="wm">
          Mood<span>oor</span>
        </span>
        <span className="badge">{badge}</span>
      </div>

      <div className="topbar-mid">{subtitle}</div>

      <nav className="pipenav" aria-label="Pipeline">
        {STEPS.map((s, i) => (
          <span className="pipeslot" key={s.step}>
            {i > 0 && <span className="pipearrow" aria-hidden="true">→</span>}
            <a
              className={`navbtn pipestep${step === s.step ? ' active' : ''}`}
              href={s.href}
              aria-current={step === s.step ? 'page' : undefined}
              onClick={() => {
                // Re-clicking the current step changes no URL, so no hashchange
                // fires on its own — announce it so the page can still reset.
                if (window.location.hash === s.href) {
                  window.dispatchEvent(new HashChangeEvent('hashchange'));
                }
              }}
            >
              <span className="pipe-n">{i + 1}</span>
              {s.label}
            </a>
          </span>
        ))}
      </nav>

      <div className="topbar-right">
        {children}
        <button
          className={`pillbtn${hasKey ? '' : ' warn'}`}
          onClick={onOpenSettings}
          title={hasKey ? 'Manage your API key' : 'No API key configured'}
        >
          {hasKey ? 'Settings' : 'Add API key'}
        </button>
      </div>
    </header>
  );
}
