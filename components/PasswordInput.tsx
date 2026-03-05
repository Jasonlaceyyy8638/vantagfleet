'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  minLength?: number;
  required?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  'aria-label'?: string;
};

const baseInputClass =
  'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-soft-cloud placeholder-soft-cloud/40 focus:outline-none focus:border-cyber-amber focus:ring-1 focus:ring-cyber-amber/50 transition-colors';

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = 'Password',
  className = baseInputClass,
  minLength,
  required,
  autoComplete,
  disabled,
  'aria-label': ariaLabel,
}: Props) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${className} pr-12`}
        minLength={minLength}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-label={ariaLabel}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-soft-cloud/60 hover:text-soft-cloud hover:bg-white/10 transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  );
}
