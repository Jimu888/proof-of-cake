import { useId } from 'react';

export function GiftingOptions<T extends string | number>({ label, options, value, onChange, display, hideLabel = false, layout = 'vault-segment' }: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  layout?: 'room-dot-options' | 'vault-segment' | 'ritual-chips' | 'ritual-option-cards';
  hideLabel?: boolean;
  display: (value: T) => string;
}) {
  const id = useId();
  return <div className="ritual-field">
    {!hideLabel && <span className="ritual-field-label" id={id}>{label}</span>}
    <div className={layout} role="group" aria-labelledby={hideLabel ? undefined : id} aria-label={hideLabel ? label : undefined}>
      {options.map(option => <button type="button" key={option} aria-pressed={value === option}
        onClick={() => onChange(option)}>{display(option)}</button>)}
    </div>
  </div>;
}

export function GiftingSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <button type="button" className="ritual-switch" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
    <span className="ritual-switch-track" aria-hidden="true"/>{label}
  </button>;
}
