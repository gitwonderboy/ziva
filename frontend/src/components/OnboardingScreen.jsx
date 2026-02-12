import React from 'react';
import { RefreshCcw, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';

const OnboardingScreen = ({ user, onComplete, showBackButton = true }) => {

  const handleMicrosoftConnect = () => {
    const encodedEmail = encodeURIComponent(user?.email || 'guest');
    const MICROSOFT_LOGIN_URL = `https://a4sklso1b4.execute-api.af-south-1.amazonaws.com/prod/login/microsoft?email=${encodedEmail}`;
    window.location.href = MICROSOFT_LOGIN_URL;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-screen font-sans">
      <div className="max-w-4xl mx-auto py-8 px-4 md:py-12 md:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent-light rounded-3xl mb-6 border border-accent/20 shadow-sm">
            <RefreshCcw className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-4xl font-bold text-text mb-4 tracking-tight">Sync Your Inbox</h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto leading-relaxed font-medium">
            Welcome, <span className="text-accent font-bold">{user?.name || 'Partner'}</span>. Connect your inbox to begin automated document extraction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Microsoft Outlook Card */}
          <button
            onClick={handleMicrosoftConnect}
            className="group bg-white p-10 rounded-3xl border border-border shadow-sm hover:shadow-2xl hover:border-accent hover:-translate-y-1 transition-all text-left"
          >
            <div className="w-14 h-14 bg-navy-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                className="w-7 h-7"
                alt="Microsoft"
              />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">Connect Outlook</h3>
            <p className="text-text-secondary mb-6 font-medium leading-snug">
              Monitor Office 365 and Microsoft Business inboxes.
            </p>
            <div className="flex items-center text-accent font-semibold text-sm uppercase tracking-wider">
              Link Account <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Google Gmail Card */}
          <button
            onClick={() => alert('Gmail integration coming soon!')}
            className="group bg-white p-10 rounded-3xl border border-border shadow-sm hover:shadow-2xl hover:border-accent hover:-translate-y-1 transition-all text-left relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 bg-bg-alt text-text-secondary text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full">
              Coming Soon
            </div>
            <div className="w-14 h-14 bg-error-light rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                className="w-7 h-7"
                alt="Google"
              />
            </div>
            <h3 className="text-xl font-bold text-text mb-2">Connect Gmail</h3>
            <p className="text-text-secondary mb-6 font-medium leading-snug">
              Automate extraction from your Google Workspace account.
            </p>
            <div className="flex items-center text-accent font-semibold text-sm uppercase tracking-wider">
              Link Account <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {showBackButton && (
          <div className="flex justify-center mb-16">
            <button
              onClick={onComplete}
              className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-accent transition-all hover:scale-105 active:scale-95 group uppercase tracking-widest"
            >
              Already connected? Take me to the dashboard
            </button>
          </div>
        )}

        {/* Security Trust Section */}
        <div className="bg-bg rounded-2xl md:rounded-3xl p-8 md:p-12 border border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-text mb-2 flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck className="w-6 h-6 text-success" /> Enterprise Security
              </h3>
              <p className="text-text-secondary font-medium max-w-sm">
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
  <div className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full border border-border text-[10px] font-semibold uppercase tracking-widest text-text-secondary shadow-sm">
    <CheckCircle2 className="w-3.5 h-3.5 text-success" /> {text}
  </div>
);

export default OnboardingScreen;
