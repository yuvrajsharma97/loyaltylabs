import { useId } from 'react';

// Track 46x26, knob 22x22 with a 2px inset: the knob is anchored at left-0.5
// and slides exactly 20px (46 - 22 - 2*2) when on. It must be anchored
// explicitly - an absolutely positioned child of a <button> otherwise sits at
// its centred "static" position and the slide pushes it out of the track.
// labelPlacement="end" puts the label after the switch - use it when the label
// text changes with state (e.g. Active/Disabled) so the switch doesn't shift.
const ToggleSwitch = ({ checked, onChange, label, labelPlacement = 'start', disabled = false }) => {
  const labelId = useId();

  const handleClick = () => {
    if (!disabled) onChange(!checked);
  };

  const isLabelAtEnd = labelPlacement === 'end';

  return (
    <div className={`flex items-center gap-3 ${isLabelAtEnd ? 'flex-row-reverse justify-end' : 'justify-between'}`}>
      {label && (
        <span
          id={labelId}
          onClick={handleClick}
          className={`select-none text-body text-text-primary ${disabled ? '' : 'cursor-pointer'}`}
        >
          {label}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? labelId : undefined}
        disabled={disabled}
        onClick={handleClick}
        className={`relative h-[26px] w-[46px] shrink-0 cursor-pointer rounded-pill transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45 ${
          checked ? 'bg-primary' : 'bg-border-strong'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute left-0.5 top-0.5 h-[22px] w-[22px] rounded-full bg-surface shadow-card transition-transform duration-150 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
