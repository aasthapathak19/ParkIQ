import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string;
}

export const Label: React.FC<LabelProps> = ({ className = '', children, ...props }) => (
  <label
    className={`block text-sm font-medium text-neutral-300 mb-1 ${className}`}
    {...props}
  >
    {children}
  </label>
);
