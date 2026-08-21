import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="form-label">{label}</label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={`input-field ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${error ? 'error' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-neutral-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className = '', id, ...props }) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && <label htmlFor={inputId} className="form-label">{label}</label>}
      <select
        id={inputId}
        className={`input-field appearance-none ${error ? 'error' : ''} ${className}`}
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\'%3E%3Cpath stroke=\'%239CA3AF\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#1f2937' }}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};
