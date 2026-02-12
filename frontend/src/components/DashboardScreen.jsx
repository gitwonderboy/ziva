import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  FileText,
  AlertCircle,
  CheckCircle2,
  Search,
  Settings,
  X,
  ExternalLink,
  Loader2,
  RefreshCcw,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Calendar,
  User,
  Download,
  HandCoins,
  ArrowDownUp,
  Menu,
  Inbox,
  Building2,
  Landmark,
  Users,
  ChevronRight,
  Upload,
  Eye,
  Clock,
  DollarSign,
  Send,
  Zap,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { fetchDashboardData, scanInbox } from '../services/api.js';
import { useProperties, useTenants, useUtilityProviders, useUtilityAccounts } from '../firebase';
import OnboardingScreen from './OnboardingScreen.jsx';
import PropertiesScreen from './PropertiesScreen.jsx';
import ProvidersScreen from './ProvidersScreen.jsx';
import TenantsScreen from './TenantsScreen.jsx';
import UtilityAccountsScreen from './UtilityAccountsScreen.jsx';
import BillsScreen from './BillsScreen.jsx';

/* ── helpers ── */
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const currentPeriod = `${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`;

function parseAmount(v) {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function formatRand(n) {
  return `R ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function daysSince(dateStr) {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(1, Math.round(diff / 86400000));
}

/* ── SVG circular progress ── */
const ProgressRing = ({ percent, size = 120, stroke = 10 }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E0E4E8" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#2ECC71"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700"
      />
    </svg>
  );
};

/* ── exception type labels ── */
const EXCEPTION_TYPES = ['Validation', 'Extraction', 'Reconciliation', 'Missing Bill'];
function getExceptionType(doc) {
  if (doc.isUnreadable) return 'Extraction';
  if (!doc.amount || parseAmount(doc.amount) === 0) return 'Missing Bill';
  if (!doc.accNo || doc.accNo === 'Unknown') return 'Validation';
  return 'Reconciliation';
}
const EXCEPTION_COLORS = {
  Validation: 'bg-error-light text-error',
  Extraction: 'bg-warning-light text-warning-dark',
  Reconciliation: 'bg-navy-50 text-navy',
  'Missing Bill': 'bg-bg-alt text-text-secondary',
};

/* ════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════ */
const DashboardScreen = ({ user, onLogout, onReset, initialTab = 'activity' }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboardStats', user?.email],
    queryFn: () => fetchDashboardData(user?.email),
    enabled: !!user?.email,
  });

  const syncMutation = useMutation({
    mutationFn: () => scanInbox(user?.email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dashboardStats'] }),
  });

  const { data: fbProperties, isLoading: propsLoading } = useProperties();
  const { data: fbTenants, isLoading: tenantsLoading } = useTenants();
  const { data: fbProviders, isLoading: providersLoading } = useUtilityProviders();
  const { data: fbAccounts, isLoading: accountsLoading } = useUtilityAccounts();

  const documents = dashboardData?.documents || [];
  const reviewQueue = useMemo(() => documents.filter((doc) => doc.status === 'FAILED'), [documents]);
  const processedQueue = useMemo(() => documents.filter((doc) => doc.status === 'SUCCESS'), [documents]);

  /* ── derived operations metrics ── */
  const ops = useMemo(() => {
    const total = documents.length;
    const extracted = documents.filter((d) => !d.isUnreadable).length;
    const validated = processedQueue.length;
    const allocated = Math.max(0, validated - Math.round(validated * 0.05));

    const totalCost = documents.reduce((s, d) => s + parseAmount(d.amount), 0);
    const tenantRecovery = processedQueue.reduce((s, d) => s + parseAmount(d.amount), 0);
    const landlordPortion = Math.max(0, totalCost - tenantRecovery);
    const completionPct = total > 0 ? Math.round((validated / total) * 100) : 0;

    const journalGenerated = validated;
    const journalPosted = Math.max(0, validated - Math.round(validated * 0.04));
    const journalPending = validated - journalPosted;

    const invoiceGenerated = total;
    const invoiceSent = Math.max(0, total - Math.round(total * 0.03));
    const invoiceDelivered = Math.max(0, invoiceSent - Math.round(invoiceSent * 0.02));

    return {
      received: total,
      extracted,
      validated,
      allocated,
      totalCost,
      tenantRecovery,
      landlordPortion,
      completionPct,
      journalGenerated,
      journalPosted,
      journalPending,
      invoiceGenerated,
      invoiceSent,
      invoiceDelivered,
    };
  }, [documents, processedQueue]);

  const recentBills = useMemo(
    () => [...documents].sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)).slice(0, 5),
    [documents],
  );

  const openExceptions = useMemo(
    () =>
      reviewQueue.slice(0, 4).map((doc, i) => ({
        ...doc,
        exId: `EX-${String(reviewQueue.length - i).padStart(4, '0')}`,
        exType: getExceptionType(doc),
        daysAgo: daysSince(doc.receivedAt),
      })),
    [reviewQueue],
  );

  const tableData = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        doc.tenant.toLowerCase().includes(filterQuery.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(filterQuery.toLowerCase());
      if (activeTab === 'review') return matchesSearch && doc.status === 'FAILED';
      if (activeTab === 'processed') return matchesSearch && doc.status === 'SUCCESS';
      return matchesSearch;
    });
  }, [activeTab, documents, filterQuery]);

  const handleMobileTabChange = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  if (isLoading)
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-bg gap-4">
        <Loader2 className="w-12 h-12 text-accent animate-spin" />
        <p className="font-bold text-text-secondary uppercase tracking-widest text-[10px]">Loading Dashboard...</p>
      </div>
    );

  return (
    <div className="flex h-screen overflow-hidden bg-bg font-sans">
      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <aside className="w-64 bg-navy text-text-on-dark/70 hidden lg:flex flex-col shrink-0 border-r border-navy-light">
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
            <ArrowDownUp className="text-white w-5 h-5" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Ziva Platform</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <SidebarButton
            active={activeTab === 'activity'}
            onClick={() => setActiveTab('activity')}
            icon={<BarChart3 />}
            label="Dashboard"
          />
          <SidebarButton
            active={activeTab === 'documents'}
            onClick={() => setActiveTab('documents')}
            icon={<FileText />}
            label="Documents"
          />
          <SidebarButton
            active={activeTab === 'properties'}
            onClick={() => setActiveTab('properties')}
            icon={<Building2 />}
            label="Properties"
          />
          <SidebarButton
            active={activeTab === 'providers'}
            onClick={() => setActiveTab('providers')}
            icon={<Landmark />}
            label="Providers"
          />
          <SidebarButton
            active={activeTab === 'tenants'}
            onClick={() => setActiveTab('tenants')}
            icon={<Users />}
            label="Tenants"
          />
          <SidebarButton
            active={activeTab === 'accounts'}
            onClick={() => setActiveTab('accounts')}
            icon={<Zap />}
            label="Utility Accounts"
          />
          <SidebarButton
            active={activeTab === 'bills'}
            onClick={() => setActiveTab('bills')}
            icon={<Receipt />}
            label="Bills"
          />
          <SidebarButton
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon={<Settings />}
            label="Settings"
          />
        </nav>

        <div className="p-4 border-t border-navy-light space-y-1">
          <button
            onClick={onReset}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-text-on-dark/50 hover:text-text-on-dark transition-all font-bold text-[10px] uppercase tracking-widest hover:bg-white/8"
          >
            <RotateCcw size={14} /> Reset System
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-on-dark/50 hover:bg-error/10 hover:text-error transition-all font-bold text-sm"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        <div className="p-4 bg-navy-light/40 mx-4 mb-6 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse-emerald"></div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">Live Connection</span>
          </div>
          <p className="text-[11px] text-text-on-dark/50 leading-tight font-medium">Gateway: af-south-1</p>
        </div>
      </aside>

      {/* ═══ MOBILE SIDEBAR OVERLAY ═══ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-72 h-full bg-navy text-text-on-dark/70 flex flex-col animate-slide-in-left">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center">
                  <ArrowDownUp className="text-white w-5 h-5" />
                </div>
                <span className="text-white font-bold text-xl tracking-tight">Ziva Platform</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:bg-white/8 rounded-xl transition-colors"
              >
                <X size={20} className="text-text-on-dark/50" />
              </button>
            </div>
            <nav className="flex-1 px-4 space-y-1 mt-2">
              <SidebarButton
                active={activeTab === 'activity'}
                onClick={() => handleMobileTabChange('activity')}
                icon={<BarChart3 />}
                label="Dashboard"
              />
              <SidebarButton
                active={activeTab === 'documents'}
                onClick={() => handleMobileTabChange('documents')}
                icon={<FileText />}
                label="Documents"
              />
              <SidebarButton
                active={activeTab === 'processed'}
                onClick={() => handleMobileTabChange('processed')}
                icon={<ShieldCheck />}
                label="Approved"
              />
              <SidebarButton
                active={activeTab === 'review'}
                onClick={() => handleMobileTabChange('review')}
                icon={<AlertCircle />}
                label="Flagged"
                count={reviewQueue.length}
              />
              <SidebarButton
                active={activeTab === 'properties'}
                onClick={() => handleMobileTabChange('properties')}
                icon={<Building2 />}
                label="Properties"
              />
              <SidebarButton
                active={activeTab === 'providers'}
                onClick={() => handleMobileTabChange('providers')}
                icon={<Landmark />}
                label="Providers"
              />
              <SidebarButton
                active={activeTab === 'tenants'}
                onClick={() => handleMobileTabChange('tenants')}
                icon={<Users />}
                label="Tenants"
              />
              <SidebarButton
                active={activeTab === 'accounts'}
                onClick={() => handleMobileTabChange('accounts')}
                icon={<Zap />}
                label="Utility Accounts"
              />
              <SidebarButton
                active={activeTab === 'bills'}
                onClick={() => handleMobileTabChange('bills')}
                icon={<Receipt />}
                label="Bills"
              />
              <SidebarButton
                active={activeTab === 'settings'}
                onClick={() => handleMobileTabChange('settings')}
                icon={<Settings />}
                label="Settings"
              />
            </nav>
            <div className="p-4 border-t border-navy-light space-y-1">
              <button
                onClick={onReset}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-text-on-dark/50 hover:text-text-on-dark transition-all font-bold text-[10px] uppercase tracking-widest hover:bg-white/8"
              >
                <RotateCcw size={14} /> Reset System
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-on-dark/50 hover:bg-error/10 hover:text-error transition-all font-bold text-sm"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ═══ MAIN ═══ */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* MOBILE TOP BAR */}
        <div className="flex lg:hidden items-center justify-between px-4 py-3 bg-navy shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-white/8 rounded-xl transition-colors"
            >
              <Menu size={20} className="text-white" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
                <ArrowDownUp className="text-white w-4 h-4" />
              </div>
              <span className="text-white font-bold text-sm tracking-tight">Ziva</span>
            </div>
          </div>
          <button
            onClick={() => syncMutation.mutate()}
            className="bg-accent text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> Sync
          </button>
        </div>

        {activeTab === 'settings' ? (
          <OnboardingScreen user={user} onComplete={() => setActiveTab('activity')} showBackButton={true} />
        ) : activeTab === 'properties' ? (
          <PropertiesScreen user={user} />
        ) : activeTab === 'providers' ? (
          <ProvidersScreen user={user} />
        ) : activeTab === 'tenants' ? (
          <TenantsScreen user={user} />
        ) : activeTab === 'accounts' ? (
          <UtilityAccountsScreen user={user} />
        ) : activeTab === 'bills' ? (
          <BillsScreen user={user} />
        ) : activeTab === 'activity' ? (
          /* ═══════════════════════════════════════════
             OPERATIONS DASHBOARD (activity tab)
             ═══════════════════════════════════════════ */
          <>
            {/* Desktop header */}
            <header className="h-16 bg-white border-b border-border hidden lg:flex items-center justify-between px-8 shrink-0 z-10">
              <div>
                <h1 className="text-lg font-bold text-text leading-none">Operations Dashboard</h1>
                <p className="text-[11px] font-bold text-text-secondary mt-0.5">
                  {user?.email} | {currentPeriod}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-bg-alt px-4 py-2 rounded-xl">
                  <Calendar className="w-4 h-4 text-text-secondary" />
                  <span className="text-xs font-semibold text-text">{currentPeriod}</span>
                </div>
                <button
                  onClick={() => syncMutation.mutate()}
                  className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-accent-hover transition-colors"
                >
                  <RefreshCcw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> Sync Data
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
              {/* ── PORTFOLIO OVERVIEW ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Properties', data: fbProperties, loading: propsLoading, icon: <Building2 className="w-5 h-5 text-navy" />, color: 'bg-navy-50', tab: 'properties' },
                  { label: 'Tenants', data: fbTenants, loading: tenantsLoading, icon: <Users className="w-5 h-5 text-accent" />, color: 'bg-accent-light', tab: 'tenants' },
                  { label: 'Providers', data: fbProviders, loading: providersLoading, icon: <Landmark className="w-5 h-5 text-warning" />, color: 'bg-warning-light', tab: 'providers' },
                  { label: 'Utility Accounts', data: fbAccounts, loading: accountsLoading, icon: <Zap className="w-5 h-5 text-success" />, color: 'bg-success-light', tab: 'accounts' },
                ].map((card) => (
                  <div
                    key={card.label}
                    onClick={card.tab ? () => setActiveTab(card.tab) : undefined}
                    className={`bg-white p-5 rounded-2xl border border-border shadow-card ${card.tab ? 'cursor-pointer hover:shadow-card-hover hover:border-accent transition-all' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>{card.icon}</div>
                      {card.loading ? (
                        <div className="w-10 h-8 bg-bg-alt rounded-lg animate-pulse" />
                      ) : (
                        <div className="text-2xl font-bold text-text">{card.data?.length ?? 0}</div>
                      )}
                    </div>
                    <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">{card.label}</div>
                  </div>
                ))}
              </div>

              {/* ── ROW 1: Processing Pipeline + Period Summary ── */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* PROCESSING PIPELINE */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-border shadow-card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                      Processing Pipeline
                    </h2>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className="text-xs font-bold text-accent flex items-center gap-1 hover:text-accent-hover"
                    >
                      View All <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {[
                      {
                        label: 'Received',
                        value: ops.received,
                        color: 'bg-navy-50 border-navy',
                        text: 'text-navy',
                        bar: 'bg-navy',
                        pct: 100,
                      },
                      {
                        label: 'Extracted',
                        value: ops.extracted,
                        color: 'bg-navy-50 border-navy-light',
                        text: 'text-navy-light',
                        bar: 'bg-navy-light',
                        pct: ops.received ? (ops.extracted / ops.received) * 100 : 0,
                      },
                      {
                        label: 'Validated',
                        value: ops.validated,
                        color: 'bg-success-light border-success',
                        text: 'text-success',
                        bar: 'bg-success',
                        pct: ops.received ? (ops.validated / ops.received) * 100 : 0,
                      },
                      {
                        label: 'Allocated',
                        value: ops.allocated,
                        color: 'bg-warning-light border-warning',
                        text: 'text-warning-dark',
                        bar: 'bg-warning',
                        pct: ops.received ? (ops.allocated / ops.received) * 100 : 0,
                      },
                    ].map((stage, i) => (
                      <div key={stage.label} className="flex items-center gap-2 md:gap-3">
                        <div className={`flex-1 rounded-xl border p-4 ${stage.color}`}>
                          <div className={`text-2xl font-bold ${stage.text} text-center`}>{stage.value}</div>
                          <div className="text-[10px] font-bold text-text-secondary text-center mt-1">{stage.label}</div>
                          <div className="mt-3 h-1.5 bg-white/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${stage.bar} transition-all duration-700`}
                              style={{ width: `${stage.pct}%` }}
                            />
                          </div>
                        </div>
                        {i < 3 && <ArrowRight className="w-4 h-4 text-border hidden md:block shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* PERIOD SUMMARY */}
                <div className="bg-white rounded-2xl border border-border shadow-card p-6">
                  <h2 className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-6">
                    Period Summary
                  </h2>
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                      <ProgressRing percent={ops.completionPct} size={110} stroke={10} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-text">{ops.completionPct}%</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-text mt-3">Overall Completion</p>
                    <p className="text-[11px] font-bold text-text-secondary">
                      {ops.validated} of {ops.received} bills
                    </p>
                  </div>
                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-secondary">Total Utility Cost</span>
                      <span className="text-sm font-bold text-text">{formatRand(ops.totalCost)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-secondary">Tenant Recovery</span>
                      <span className="text-sm font-bold text-success">{formatRand(ops.tenantRecovery)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-secondary">Landlord Portion</span>
                      <span className="text-sm font-bold text-text">{formatRand(ops.landlordPortion)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── ROW 2: Recent Utility Bills + Open Exceptions ── */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* RECENT UTILITY BILLS */}
                <div className="xl:col-span-3 bg-white rounded-2xl border border-border shadow-card overflow-hidden">
                  <div className="px-6 py-5 flex items-center justify-between border-b border-border">
                    <h2 className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                      Recent Utility Bills
                    </h2>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className="text-xs font-bold text-accent flex items-center gap-1 hover:text-accent-hover"
                    >
                      View All <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="px-6 py-3 text-[10px] font-medium text-text-secondary uppercase tracking-widest">
                            Bill ID
                          </th>
                          <th className="px-6 py-3 text-[10px] font-medium text-text-secondary uppercase tracking-widest">
                            Property
                          </th>
                          <th className="px-6 py-3 text-[10px] font-medium text-text-secondary uppercase tracking-widest hidden md:table-cell">
                            Utility
                          </th>
                          <th className="px-6 py-3 text-[10px] font-medium text-text-secondary uppercase tracking-widest">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-[10px] font-medium text-text-secondary uppercase tracking-widest">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {recentBills.map((doc, i) => {
                          const billId = `B-${new Date(doc.receivedAt).getFullYear()}-${String(documents.length - i).padStart(4, '0')}`;
                          const utilityType = doc.fileName?.toLowerCase().includes('elec')
                            ? 'Electricity'
                            : doc.fileName?.toLowerCase().includes('water')
                              ? 'Water'
                              : doc.fileName?.toLowerCase().includes('rate')
                                ? 'Rates'
                                : 'Municipal';
                          return (
                            <tr
                              key={doc.id}
                              onClick={() => setSelectedDoc(doc)}
                              className="hover:bg-bg cursor-pointer transition-colors"
                            >
                              <td className="px-6 py-4 text-sm font-bold text-accent">{billId}</td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-text truncate max-w-[180px]">
                                  {doc.fileName?.replace(/\.[^.]+$/, '') || 'Unknown'}
                                </p>
                                <p className="text-[10px] font-bold text-text-secondary">
                                  {doc.tenant?.split('@')[0] || '\u2014'}
                                </p>
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-text-secondary hidden md:table-cell">
                                {utilityType}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-text">
                                R {parseAmount(doc.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-6 py-4">
                                <BillStatusBadge status={doc.status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {recentBills.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Inbox className="w-6 h-6 text-border mb-2" />
                        <p className="text-xs font-bold text-text-secondary">No bills yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* OPEN EXCEPTIONS */}
                <div className="xl:col-span-2 bg-white rounded-2xl border border-border shadow-card overflow-hidden">
                  <div className="px-6 py-5 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-2">
                      <h2 className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                        Open Exceptions
                      </h2>
                      {reviewQueue.length > 0 && (
                        <span className="text-[10px] font-semibold bg-error-light text-error px-2 py-0.5 rounded-full">
                          {reviewQueue.length}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setActiveTab('review')}
                      className="text-xs font-bold text-error flex items-center gap-1 hover:text-error"
                    >
                      View All <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="divide-y divide-border">
                    {openExceptions.map((ex) => (
                      <div
                        key={ex.id}
                        onClick={() => setSelectedDoc(ex)}
                        className="px-6 py-4 hover:bg-bg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-error"></span>
                            <span className="text-xs font-bold text-text">{ex.exId}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-semibold ${EXCEPTION_COLORS[ex.exType]}`}
                            >
                              {ex.exType}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-text-secondary flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {ex.daysAgo} {ex.daysAgo === 1 ? 'day' : 'days'}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-text truncate">
                          {ex.fileName?.replace(/\.[^.]+$/, '') || 'Unknown issue'}
                        </p>
                        <p className="text-[11px] font-bold text-text-secondary truncate">
                          {ex.tenant?.split('@')[0] || '\u2014'}
                        </p>
                      </div>
                    ))}
                    {openExceptions.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <CheckCircle2 className="w-6 h-6 text-success mb-2" />
                        <p className="text-xs font-bold text-text-secondary">No open exceptions</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── ROW 3: Journal Status + Tenant Invoices + Quick Actions ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* JOURNAL STATUS */}
                <div className="bg-white rounded-2xl border border-border shadow-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-semibold text-text">Journal Status</h2>
                    <div className="w-9 h-9 rounded-xl bg-bg-alt flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-text-secondary" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-secondary">Generated</span>
                      <span className="text-sm font-bold text-text">{ops.journalGenerated}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-secondary">Posted to SAP</span>
                      <span className="text-sm font-bold text-accent">{ops.journalPosted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-secondary">Pending</span>
                      <span className="text-sm font-bold text-warning">{ops.journalPending}</span>
                    </div>
                  </div>
                </div>

                {/* TENANT INVOICES */}
                <div className="bg-white rounded-2xl border border-border shadow-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-semibold text-text">Tenant Invoices</h2>
                    <div className="w-9 h-9 rounded-xl bg-bg-alt flex items-center justify-center">
                      <Send className="w-4 h-4 text-text-secondary" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-secondary">Generated</span>
                      <span className="text-sm font-bold text-text">{ops.invoiceGenerated}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-secondary">Sent</span>
                      <span className="text-sm font-bold text-accent">{ops.invoiceSent}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-secondary">Delivered</span>
                      <span className="text-sm font-bold text-success">{ops.invoiceDelivered}</span>
                    </div>
                  </div>
                </div>

                {/* QUICK ACTIONS */}
                <div className="bg-white rounded-2xl border border-border shadow-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-semibold text-text">Quick Actions</h2>
                    <div className="w-9 h-9 rounded-xl bg-bg-alt flex items-center justify-center">
                      <Zap className="w-4 h-4 text-text-secondary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => syncMutation.mutate()}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-accent hover:bg-accent-light transition-colors text-left"
                    >
                      <Upload className="w-4 h-4" /> Sync Inbox
                    </button>
                    <button
                      onClick={() => setActiveTab('review')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-accent hover:bg-accent-light transition-colors text-left"
                    >
                      <Eye className="w-4 h-4" /> Review Exceptions
                    </button>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-accent hover:bg-accent-light transition-colors text-left"
                    >
                      <BarChart3 className="w-4 h-4" /> View All Documents
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ═══════════════════════════════════════════
             DOCUMENTS / APPROVED / FLAGGED tabs
             ═══════════════════════════════════════════ */
          <>
            <header className="h-16 bg-white border-b border-border hidden lg:flex items-center justify-between px-8 shrink-0 z-10">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  className="w-full bg-bg border-border border rounded-xl py-2 pl-12 pr-4 text-sm font-bold outline-none focus:border-accent transition-colors"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 bg-accent-light border border-accent px-4 py-2 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  <span className="text-[11px] font-semibold text-accent-hover uppercase tracking-tight">{user?.email}</span>
                </div>
                <button
                  onClick={() => syncMutation.mutate()}
                  className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-accent-hover transition-colors"
                >
                  <RefreshCcw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> Sync Data
                </button>
              </div>
            </header>

            {/* Mobile search */}
            <div className="lg:hidden px-4 py-3 bg-white border-b border-border shrink-0">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  className="w-full bg-bg border-border border rounded-xl py-2 pl-10 pr-4 text-sm font-bold outline-none focus:border-accent transition-colors"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
              <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
                <div className="px-4 md:px-8 py-5 border-b border-border flex items-center gap-4 md:gap-8 bg-bg/30 overflow-x-auto">
                  <TabButton
                    active={activeTab === 'documents'}
                    label="Documents"
                    count={documents.length}
                    onClick={() => setActiveTab('documents')}
                  />
                  <TabButton
                    active={activeTab === 'processed'}
                    label="Approved"
                    count={processedQueue.length}
                    onClick={() => setActiveTab('processed')}
                  />
                  <TabButton
                    active={activeTab === 'review'}
                    label="Flagged"
                    count={reviewQueue.length}
                    onClick={() => setActiveTab('review')}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 md:px-8 py-3 text-[10px] font-medium text-text-secondary uppercase tracking-widest">
                          Document
                        </th>
                        <th className="px-4 md:px-8 py-3 text-[10px] font-medium text-text-secondary uppercase tracking-widest">
                          Status
                        </th>
                        <th className="px-4 md:px-8 py-3 text-[10px] font-medium text-text-secondary uppercase tracking-widest hidden sm:table-cell">
                          Date
                        </th>
                        <th className="px-4 md:px-8 py-3 text-[10px] font-medium text-text-secondary uppercase tracking-widest">
                          Amount
                        </th>
                        <th className="px-4 md:px-8 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {tableData.map((doc) => (
                        <tr
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className="hover:bg-bg group cursor-pointer transition-colors"
                        >
                          <td className="px-4 md:px-8 py-4 md:py-6">
                            <div className="flex items-center gap-3 md:gap-4">
                              <FileText
                                className={`w-5 h-5 shrink-0 ${doc.status === 'SUCCESS' ? 'text-success' : 'text-warning'}`}
                              />
                              <div className="min-w-0 max-w-[240px]">
                                <p className="text-sm font-bold text-text truncate">{doc.fileName}</p>
                                <p className="text-[11px] font-bold text-text-secondary truncate">{doc.tenant}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6">
                            <StatusBadge status={doc.status} />
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6 text-[11px] font-bold text-text-secondary hidden sm:table-cell">
                            {new Date(doc.receivedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6 font-bold text-text text-sm">
                            R {doc.amount}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                            <ExternalLink className="w-4 h-4 text-border opacity-0 group-hover:opacity-100 transition-all" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {tableData.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-8">
                      <div className="w-12 h-12 bg-bg-alt rounded-2xl flex items-center justify-center mb-4">
                        <Inbox className="w-6 h-6 text-text-secondary" />
                      </div>
                      <p className="text-sm font-bold text-text-secondary">No documents found</p>
                      {filterQuery && <p className="text-xs text-text-secondary mt-1">Try adjusting your search query</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══ DOC DETAIL DRAWER ═══ */}
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setSelectedDoc(null)} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="font-bold text-text text-lg">Document Details</h2>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 hover:bg-bg-alt rounded-full transition-colors"
                >
                  <X size={20} className="text-text-secondary" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${selectedDoc.status === 'SUCCESS' ? 'bg-success-light text-success' : 'bg-warning-light text-warning'}`}
                  >
                    <FileText size={28} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-text leading-tight mb-1 truncate">{selectedDoc.fileName}</h3>
                    <StatusBadge status={selectedDoc.status} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <DetailBox icon={<User />} label="Tenant" value={selectedDoc.tenant} />
                  <DetailBox
                    icon={<Calendar />}
                    label="Received"
                    value={new Date(selectedDoc.receivedAt).toLocaleDateString()}
                  />
                  <DetailBox icon={<HandCoins />} label="Amount" value={`R ${selectedDoc.amount}`} />
                  <DetailBox icon={<Download />} label="File Size" value="2.4 MB" />
                </div>
                <div className="p-6 bg-bg rounded-2xl border border-border">
                  <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-4">
                    AI Extraction Insight
                  </p>
                  <p className="text-sm font-semibold text-text-secondary leading-relaxed italic">
                    {selectedDoc.status === 'SUCCESS'
                      ? 'The AI successfully matched this document to your existing records with 98% confidence.'
                      : 'The system flagged this entry due to an unclear amount format. Please review manually.'}
                  </p>
                </div>
              </div>
              <div className="p-6 border-t bg-bg/50 flex gap-3">
                <button className="flex-1 bg-navy text-white py-3 rounded-xl font-bold text-sm hover:bg-navy-hover transition-colors">
                  Download PDF
                </button>
                {selectedDoc.status === 'FAILED' && (
                  <button className="flex-1 bg-accent text-white py-3 rounded-xl font-bold text-sm hover:bg-accent-hover transition-colors">
                    Validate Entry
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

/* ═══════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════ */

const DetailBox = ({ icon, label, value }) => (
  <div className="p-4 bg-white border border-border rounded-2xl">
    <div className="flex items-center gap-2 text-text-secondary mb-1">
      {React.cloneElement(icon, { size: 14 })}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-sm font-bold text-text truncate">{value}</p>
  </div>
);

const SidebarButton = ({ active, icon, label, count, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${active ? 'bg-accent-15 text-text-on-dark border-l-4 border-accent' : 'hover:bg-white/8 text-text-on-dark/70'}`}
  >
    <div className="flex items-center gap-3">
      {React.cloneElement(icon, { size: 18 })} <span className="font-bold text-sm">{label}</span>
    </div>
    {count > 0 && (
      <span
        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${active ? 'bg-white text-accent' : 'bg-warning text-white'}`}
      >
        {count}
      </span>
    )}
  </button>
);

const StatusBadge = ({ status }) => (
  <span
    className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${status === 'SUCCESS' ? 'bg-success-light text-success' : 'bg-warning-light text-warning-dark'}`}
  >
    {status === 'SUCCESS' ? 'Processed' : 'Flagged'}
  </span>
);

const BillStatusBadge = ({ status }) => {
  const styles = {
    SUCCESS: 'bg-success-light text-success',
    FAILED: 'bg-error-light text-error',
  };
  const labels = {
    SUCCESS: 'Completed',
    FAILED: 'Exception',
  };
  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${styles[status] || 'bg-bg-alt text-text-secondary'}`}
    >
      {labels[status] || status}
    </span>
  );
};

const TabButton = ({ active, label, count, onClick }) => (
  <button
    onClick={onClick}
    className={`text-sm font-bold pb-4 transition-all relative whitespace-nowrap ${active ? 'text-navy' : 'text-text-secondary'}`}
  >
    {label}{' '}
    {count !== undefined && <span className="ml-2 bg-bg-alt px-2 py-0.5 rounded-full text-[10px]">{count}</span>}
    {active && <span className="absolute bottom-0 left-0 w-full h-1 bg-accent rounded-t-full" />}
  </button>
);

export default DashboardScreen;
