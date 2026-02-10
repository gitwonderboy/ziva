import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const partner = searchParams.get('partner') || 'your primary inbox';

  useEffect(() => {
    // 1. Confetti Cannons
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      confetti({ particleCount: 40, origin: { x: Math.random(), y: Math.random() - 0.2 } });
    }, 250);

    // 2. THE FLAG: This is what tells App.jsx "this user is no longer new"
    const timer = setTimeout(() => {
      localStorage.setItem('onboarding_done', 'true');
      navigate('/dashboard');
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="h-screen w-full bg-slate-900 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-12 shadow-[0_0_50px_rgba(79,70,229,0.3)] text-center space-y-8 animate-fade-in-scale relative overflow-hidden">
        <Sparkles className="absolute top-10 right-10 text-indigo-100 w-12 h-12" />
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-25"></div>
          <div className="relative bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
            <CheckCircle2 size={48} className="text-emerald-500" />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Granted!</h1>
          <p className="text-slate-500 font-bold px-4">
            Successfully connected <br/>
            <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{partner}</span>
          </p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-6 flex items-center justify-center gap-4 border border-slate-100">
          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Syncing Portfolio...</p>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccess;
