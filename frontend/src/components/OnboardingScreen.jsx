import React from 'react';
import { RefreshCcw, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';

const OnboardingScreen = ({ user, onComplete, showBackButton = true }) => {

  const handleMicrosoftConnect = () => {
    const encodedEmail = encodeURIComponent(user?.email || 'guest');
    const MICROSOFT_LOGIN_URL = `${import.meta.env.VITE_API_BASE_URL}/login/microsoft?email=${encodedEmail}`;
    window.location.href = MICROSOFT_LOGIN_URL;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-screen font-sans">
      <div className="max-w-4xl mx-auto py-8 px-4 md:py-12 md:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 rounded-3xl mb-6 border border-indigo-100 shadow-sm">
            <RefreshCcw className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Sync Your Inbox</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed font-medium">
            Welcome, <span className="text-indigo-600 font-bold">{user?.name || 'Partner'}</span>. Connect your inbox to begin automated document extraction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Microsoft Outlook Card */}
          <button
            onClick={handleMicrosoftConnect}
            className="group bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-400 hover:-translate-y-1 transition-all text-left"
          >
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                className="w-7 h-7"
                alt="Microsoft"
              />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Connect Outlook</h3>
            <p className="text-slate-500 mb-6 font-medium leading-snug">
              Monitor Office 365 and Microsoft Business inboxes.
            </p>
            <div className="flex items-center text-indigo-600 font-black text-sm uppercase tracking-wider">
              Link Account <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Google Gmail Card */}
          <button
            onClick={() => alert('Gmail integration coming soon!')}
            className="group bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-400 hover:-translate-y-1 transition-all text-left relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
              Coming Soon
            </div>
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                className="w-7 h-7"
                alt="Google"
              />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Connect Gmail</h3>
            <p className="text-slate-500 mb-6 font-medium leading-snug">
              Automate extraction from your Google Workspace account.
            </p>
            <div className="flex items-center text-indigo-600 font-black text-sm uppercase tracking-wider">
              Link Account <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {showBackButton && (
          <div className="flex justify-center mb-16">
            <button
              onClick={onComplete}
              className="flex items-center gap-2 text-sm font-black text-slate-400 hover:text-indigo-600 transition-all hover:scale-105 active:scale-95 group uppercase tracking-widest"
            >
              Already connected? Take me to the dashboard
            </button>
          </div>
        )}

        {/* Security Trust Section */}
        <div className="bg-slate-50 rounded-2xl md:rounded-3xl p-8 md:p-12 border border-slate-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-500" /> Enterprise Security
              </h3>
              <p className="text-slate-500 font-medium max-w-sm">
                Data is encrypted end-to-end. We never store passwords directly.
              </p>
            </div>
            <div className="flex gap-4">
              <Badge text="SOC2 Type II" />
              <Badge text="GDPR Ready" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Badge = ({ text }) => (
  <div className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm">
    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> {text}
  </div>
);

export default OnboardingScreen;
