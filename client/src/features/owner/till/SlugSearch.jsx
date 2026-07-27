import { useState } from 'react';
import Button from '../../../shared/components/Button';

const inputClass =
  'w-full bg-surface-container-low border border-outline-variant rounded-lg px-md py-md font-body text-body-md placeholder:text-outline outline-none focus:border-primary transition-all';
const labelClass = 'font-body text-body-sm text-on-surface-variant ml-xs';

export default function SlugSearch({ onSubmit, submitting, onCancel }) {
  const [slug, setSlug] = useState('');
  const [tillPin, setTillPin] = useState('');

  return (
    <div className="flex flex-col gap-lg">
      <div className="space-y-xs">
        <label className={labelClass}>Customer's username</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. alex-chen" className={inputClass} />
      </div>
      <div className="space-y-xs">
        <label className={labelClass}>Your till PIN</label>
        <input
          value={tillPin}
          onChange={(e) => setTillPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric"
          placeholder="1234"
          className={`${inputClass} font-mono tracking-[0.2em] text-center`}
        />
      </div>
      <div className="flex gap-md">
        <Button variant="text" className="flex-1 border border-outline-variant" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          loading={submitting}
          disabled={!slug || tillPin.length !== 4}
          onClick={() => onSubmit({ slug, tillPin })}
        >
          Look up
        </Button>
      </div>
    </div>
  );
}
