import React from 'react';

interface BadgeProps {
  variant?: 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'purple';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'gray', children, className = '' }) => (
  <span className={`badge badge-${variant} ${className}`}>{children}</span>
);

// Status → variant mapper
export const statusVariant = (status: string): BadgeProps['variant'] => {
  const map: Record<string, BadgeProps['variant']> = {
    active: 'green', confirmed: 'green', available: 'green', approved: 'green', paid: 'green',
    pending: 'yellow', reserved: 'yellow',
    cancelled: 'red', rejected: 'red', suspended: 'red', danger: 'red', failed: 'red',
    completed: 'blue', inactive: 'gray', maintenance: 'gray', occupied: 'blue',
  };
  return map[status] ?? 'gray';
};
