import React from 'react';
import { Link } from 'react-router-dom';
import { ParkingSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => (
  <div
    className="min-h-screen flex items-center justify-center p-4"
    style={{
      background: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(16,185,129,0.15), transparent), linear-gradient(135deg, #0a0f1e 0%, #111827 100%)',
    }}
  >
    {/* Background Grid */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }}
    />

    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-full max-w-md relative z-10"
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <Link to="/" className="flex items-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <ParkingSquare className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            ParkIQ <span className="gradient-text">AI</span>
          </span>
        </Link>
        <h1 className="text-3xl font-bold text-white text-center">{title}</h1>
        {subtitle && <p className="text-neutral-400 text-sm mt-1 text-center">{subtitle}</p>}
      </div>

      {/* Card */}
      <div className="glass rounded-2xl p-8 shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        {children}
      </div>
    </motion.div>
  </div>
);
