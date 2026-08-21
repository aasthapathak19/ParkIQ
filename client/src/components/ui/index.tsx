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

interface SkeletonProps {
  className?: string;
  rounded?: boolean;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', rounded = false, lines }) => {
  if (lines) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`skeleton h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'} ${rounded ? 'rounded-full' : 'rounded'}`} />
        ))}
      </div>
    );
  }
  return <div className={`skeleton ${rounded ? 'rounded-full' : 'rounded'} ${className}`} />;
};

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md', className = ''
}) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} ${className} rounded-full border-2 border-neutral-700 border-t-emerald-400 animate-spin`} />
  );
};

export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
    {icon && <div className="text-neutral-600 mb-2">{icon}</div>}
    <h3 className="text-lg font-semibold text-neutral-300">{title}</h3>
    {description && <p className="text-sm text-neutral-500 max-w-xs">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
