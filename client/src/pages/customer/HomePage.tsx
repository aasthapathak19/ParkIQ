import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Shield, Zap, Star, TrendingUp, ParkingSquare, ArrowRight } from 'lucide-react';
import { PublicLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';

const features = [
  { icon: <MapPin className="w-6 h-6 text-emerald-400" />, title: 'Real-Time Availability', desc: 'See live slot availability with 30-second refresh intervals across thousands of lots.' },
  { icon: <Shield className="w-6 h-6 text-indigo-400" />, title: 'Secure Booking', desc: 'End-to-end encrypted bookings with QR-based check-in. No more paper tickets.' },
  { icon: <Zap className="w-6 h-6 text-amber-400" />, title: 'Instant Confirmation', desc: 'Get your booking confirmed in under 2 seconds with a digital QR code sent instantly.' },
  { icon: <TrendingUp className="w-6 h-6 text-purple-400" />, title: 'AI-Powered Pricing', desc: 'Dynamic pricing ensures you get the best rates based on demand, time, and location.' },
];

const stats = [
  { value: '50K+', label: 'Parking Spots' },
  { value: '200+', label: 'Cities' },
  { value: '1M+', label: 'Bookings Done' },
  { value: '4.9★', label: 'User Rating' },
];

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <PublicLayout>
      {/* Hero */}
      <section
        className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16,185,129,0.12), transparent), linear-gradient(180deg, #0a0f1e 0%, #111827 100%)',
        }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Glow orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-medium text-emerald-400"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <Star className="w-3 h-3" />
            AI-Powered Smart Parking Platform
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Park Smarter,<br />
            <span className="gradient-text">Drive Freer</span>
          </h1>

          <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Find, book, and pay for parking in seconds. AI-powered slot detection, real-time availability,
            and contactless check-in — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/search">
              <Button size="lg" leftIcon={<Search className="w-5 h-5" />}>
                Find Parking Near Me
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link to="/register">
                <Button variant="secondary" size="lg">
                  Create Free Account
                </Button>
              </Link>
            )}
          </div>
        </motion.div>

        {/* Search bar preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full max-w-2xl mt-12"
        >
          <Link to="/search" className="block">
            <div className="glass rounded-2xl p-4 flex items-center gap-3 hover:border-emerald-500/30 transition-colors cursor-pointer"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <MapPin className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-neutral-500 text-sm flex-1">Search by location, landmark or parking lot name...</span>
              <span className="btn-primary text-sm px-4 py-2 pointer-events-none">Search</span>
            </div>
          </Link>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 border-y border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-4xl font-bold gradient-text mb-1">{s.value}</p>
              <p className="text-sm text-neutral-400">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-white mb-3">Why ParkIQ AI?</h2>
            <p className="text-neutral-400">Built for the future of urban mobility</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                viewport={{ once: true }}
                className="glass rounded-xl p-6 card-hover"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto text-center glass rounded-2xl p-12" style={{ border: '1px solid rgba(16,185,129,0.15)', background: 'rgba(16,185,129,0.04)' }}>
            <ParkingSquare className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-3">Ready to park smarter?</h2>
            <p className="text-neutral-400 mb-8">Join over 1 million drivers who trust ParkIQ AI.</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/register"><Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>Get Started Free</Button></Link>
              <Link to="/search"><Button variant="secondary" size="lg">Explore Parking</Button></Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 text-center text-sm text-neutral-500">
        © {new Date().getFullYear()} ParkIQ AI · All rights reserved
      </footer>
    </PublicLayout>
  );
};

export default HomePage;
