import { useEffect, useState } from 'react';
import { MODEL } from '../lib/claude';

export default function SettingsDialog({
  open,
  initialKey,
  onSave,
  onClose,
}: {
  open: boolean;
  initialKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialKey);

  useEffect(() => {
    if (open) setValue(initialKey);
  }, [open, initialKey]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="settings-title">Anthropic API key</h2>
        <p>
          Both tools call Claude directly from this browser. Your key is stored in this browser only
          — it is never sent anywhere except to Anthropic.
        </p>

        <label className="modal-label" htmlFor="api-key">
          Secret key
        </label>
        <input
          id="api-key"
          className="modal-input"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="sk-ant-…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave(value.trim());
          }}
        />

        <p className="modal-note">
          Requests run on <code>{MODEL}</code>. A key on a shared machine is readable by anything
          else running on this origin — use a scoped key you can rotate.
        </p>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-solid" onClick={() => onSave(value.trim())}>
            Save key
          </button>
        </div>
      </div>
    </div>
  );
}
