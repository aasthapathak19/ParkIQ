import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glass?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  hoverable = false,
  glass = false,
  padding = 'md',
  children,
  className = '',
  ...props
}) => {
  const base = glass ? 'glass' : 'bg-dark-800';
  const pad = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
  const hover = hoverable ? 'card-hover cursor-pointer' : '';

  return (
    <div
      className={`${base} rounded-xl border border-white/5 ${pad[padding]} ${hover} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'blue' | 'yellow' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title, value, icon, change, changeType = 'neutral', color = 'green'
}) => {
  const colors = {
    green: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
    blue: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20',
    yellow: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20',
  };
  const iconColors = { green: 'text-emerald-400', blue: 'text-indigo-400', yellow: 'text-amber-400', purple: 'text-purple-400' };
  const changeColors = { up: 'text-emerald-400', down: 'text-red-400', neutral: 'text-neutral-400' };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5 relative overflow-hidden group hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 hover:shadow-xl`}>
      {/* Decorative background glow */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors`} />
      
      <div className="flex items-center justify-between mb-3 relative z-10">
        <p className="text-sm text-neutral-400 font-medium">{title}</p>
        <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${iconColors[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1 relative z-10">{value}</p>
      {change && (
        <p className={`text-xs ${changeColors[changeType]} font-medium relative z-10`}>{change}</p>
      )}
    </div>
  );
};

// ─── Card Sub-Components ──────────────────────────────────────────────────────
export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>{children}</div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-white ${className}`} {...props}>{children}</h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-neutral-400 ${className}`} {...props}>{children}</p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>{children}</div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`mt-4 pt-4 border-t border-white/5 ${className}`} {...props}>{children}</div>
);

