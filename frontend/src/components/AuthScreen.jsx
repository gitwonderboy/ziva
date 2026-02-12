import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuthScreen = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);

    // Artificial delay for a "Pro" feel, then login any email
    setTimeout(() => {
      onLogin({
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        name: email.split('@')[0], // Grabs the name from the email
        email: email,
      });
      setLoading(false);
      navigate('/onboarding');
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-white">
      {/* MOBILE BRANDING BAR */}
      <div className="flex md:hidden items-center gap-2 px-6 py-4 bg-navy">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <ShieldCheck className="text-white w-4 h-4" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white">Ziva Platform</span>
      </div>

      {/* LEFT PANEL: Branding & Marketing */}
      <div className="hidden md:flex flex-1 bg-navy items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Decorative Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent pointer-events-none" />

        <div className="max-w-md z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shadow-lg border border-white/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Ziva Platform</span>
          </div>

          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Review by Exception. <br />
            <span className="text-accent/70">Scale with Ease.</span>
          </h1>

          <p className="text-text-on-dark/80 text-lg leading-relaxed mb-10 font-medium opacity-90">
            Automate your property revenue verification. We extract, match, and highlight discrepancies so you only
            spend time where it matters.
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/5 p-5 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-text-on-dark/70 mt-1">
                Extraction Accuracy
              </div>
            </div>
            <div className="bg-white/5 p-5 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="text-3xl font-bold text-white">1.2s</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-text-on-dark/70 mt-1">
                Processing Speed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-bold text-text mb-3 tracking-tight">Welcome back</h2>
            <p className="text-text-secondary font-medium">Sign in to your portal to manage your portfolio.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-widest ml-1">Email address</label>
              <input
                type="email"
                required
                disabled={loading}
                className="w-full px-5 py-3.5 bg-bg border border-border rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all font-medium text-text disabled:opacity-50"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-widest ml-1">Password</label>
              <input
                type="password"
                required
                disabled={loading}
                className="w-full px-5 py-3.5 bg-bg border border-border rounded-2xl focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none transition-all font-medium text-text disabled:opacity-50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent cursor-pointer"
                />
                <span className="text-sm font-medium text-text-secondary group-hover:text-text transition-colors">
                  Keep me signed in
                </span>
              </label>
              <button type="button" className="text-sm font-medium text-accent hover:text-accent-hover">
                Reset password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-4 rounded-2xl font-bold hover:bg-accent-hover transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Enter Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-text-secondary">
            New to Ziva? <button className="text-accent hover:underline">Start free trial</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
