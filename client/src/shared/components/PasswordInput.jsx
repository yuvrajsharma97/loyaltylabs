import { useState } from 'react';

export default function PasswordInput({ id, value, onChange, placeholder, required = true, minLength }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative flex items-center rounded-lg">
      <span className="material-symbols-outlined absolute left-md text-outline">lock</span>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-11 pr-11 py-[14px] bg-surface-container-low border border-outline-variant rounded-lg text-on-surface placeholder:text-outline focus:border-primary focus:ring-0 transition-all outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-md p-xs text-outline hover:text-primary transition-colors focus:outline-none"
      >
        <span className="material-symbols-outlined">{visible ? 'visibility_off' : 'visibility'}</span>
      </button>
    </div>
  );
}
