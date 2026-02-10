import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  FileText,
  AlertCircle,
  CheckCircle2,
  Search,
  Activity,
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
} from 'lucide-react';
import { fetchDashboardData, scanInbox } from '../services/api.js';
import OnboardingScreen from './OnboardingScreen.jsx';

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

  const documents = dashboardData?.documents || [];
  const reviewQueue = useMemo(() => documents.filter((doc) => doc.status === 'FAILED'), [documents]);
  const processedQueue = useMemo(() => documents.filter((doc) => doc.status === 'SUCCESS'), [documents]);

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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Loading Dashboard...</p>
      </div>
    );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* DESKTOP SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden lg:flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
            <ArrowDownUp className="text-white w-5 h-5" />
          </div>
          <span className="text-white font-black text-xl tracking-tight">Ziva Platform</span>
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
            active={activeTab === 'processed'}
            onClick={() => setActiveTab('processed')}
            icon={<ShieldCheck />}
            label="Approved"
          />
          <SidebarButton
            active={activeTab === 'review'}
            onClick={() => setActiveTab('review')}
            icon={<AlertCircle />}
            label="Flagged"
            count={reviewQueue.length}
          />
          <SidebarButton
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
            icon={<Settings />}
            label="Settings"
          />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-1">
          <button
            onClick={onReset}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-slate-500 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest hover:bg-white/5"
          >
            <RotateCcw size={14} /> Reset System
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-bold text-sm"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        <div className="p-4 bg-slate-800/40 mx-4 mb-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Live Connection</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight font-medium">Gateway: af-south-1</p>
        </div>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-72 h-full bg-slate-900 text-slate-300 flex flex-col animate-slide-in-left">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
                  <ArrowDownUp className="text-white w-5 h-5" />
                </div>
                <span className="text-white font-black text-xl tracking-tight">Ziva Platform</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-2">
              <SidebarButton active={activeTab === 'activity'} onClick={() => handleMobileTabChange('activity')} icon={<BarChart3 />} label="Dashboard" />
              <SidebarButton active={activeTab === 'documents'} onClick={() => handleMobileTabChange('documents')} icon={<FileText />} label="Documents" />
              <SidebarButton active={activeTab === 'processed'} onClick={() => handleMobileTabChange('processed')} icon={<ShieldCheck />} label="Approved" />
              <SidebarButton active={activeTab === 'review'} onClick={() => handleMobileTabChange('review')} icon={<AlertCircle />} label="Flagged" count={reviewQueue.length} />
              <SidebarButton active={activeTab === 'settings'} onClick={() => handleMobileTabChange('settings')} icon={<Settings />} label="Settings" />
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-1">
              <button
                onClick={onReset}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-slate-500 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest hover:bg-white/5"
              >
                <RotateCcw size={14} /> Reset System
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-bold text-sm"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* MOBILE TOP BAR */}
        <div className="flex lg:hidden items-center justify-between px-4 py-3 bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <Menu size={20} className="text-white" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
                <ArrowDownUp className="text-white w-4 h-4" />
              </div>
              <span className="text-white font-bold text-sm tracking-tight">Ziva</span>
            </div>
          </div>
          <button
            onClick={() => syncMutation.mutate()}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> Sync
          </button>
        </div>

        {activeTab === 'settings' ? (
          <OnboardingScreen user={user} onComplete={() => setActiveTab('activity')} showBackButton={true} />
        ) : (
          <>
            <header className="h-16 bg-white border-b border-slate-200 hidden lg:flex items-center justify-between px-8 shrink-0 z-10">
              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  className="w-full bg-slate-50 border-slate-200 border rounded-xl py-2 pl-12 pr-4 text-sm font-bold outline-none focus:border-indigo-500 transition-colors"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] font-black text-indigo-700 uppercase tracking-tight">{user?.email}</span>
                </div>
                <button
                  onClick={() => syncMutation.mutate()}
                  className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-slate-800 transition-colors"
                >
                  <RefreshCcw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} /> Sync Data
                </button>
              </div>
            </header>

            {/* MOBILE SEARCH BAR */}
            <div className="lg:hidden px-4 py-3 bg-white border-b border-slate-200 shrink-0">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  className="w-full bg-slate-50 border-slate-200 border rounded-xl py-2 pl-10 pr-4 text-sm font-bold outline-none focus:border-indigo-500 transition-colors"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8">
              {['activity'].includes(activeTab) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <KPICard
                    label="Total Inbound"
                    value={dashboardData?.summary.total}
                    icon={<FileText className="text-blue-600" />}
                  />
                  <KPICard
                    label="Auto-Processed"
                    value={dashboardData?.summary.processed}
                    status="success"
                    icon={<CheckCircle2 className="text-emerald-600" />}
                  />
                  <KPICard
                    label="Action Required"
                    value={dashboardData?.summary.failed}
                    status="warning"
                    icon={<AlertCircle className="text-amber-600" />}
                  />
                  <KPICard
                    label="Success Rate"
                    value={`${dashboardData?.summary.successRate}%`}
                    icon={<Activity className="text-indigo-600" />}
                  />
                </div>
              )}

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 md:px-8 py-5 border-b border-slate-100 flex items-center gap-4 md:gap-8 bg-slate-50/30 overflow-x-auto">
                  <TabButton
                    active={activeTab === 'activity'}
                    label="Overview"
                    onClick={() => setActiveTab('activity')}
                  />
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
                      <tr className="border-b border-slate-100">
                        <th className="px-4 md:px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document</th>
                        <th className="px-4 md:px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-4 md:px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Date</th>
                        <th className="px-4 md:px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                        <th className="px-4 md:px-8 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {tableData.map((doc) => (
                        <tr
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className="hover:bg-slate-50 group cursor-pointer transition-colors"
                        >
                          <td className="px-4 md:px-8 py-4 md:py-6">
                            <div className="flex items-center gap-3 md:gap-4">
                              <FileText
                                className={`w-5 h-5 shrink-0 ${doc.status === 'SUCCESS' ? 'text-emerald-500' : 'text-amber-500'}`}
                              />
                              <div className="min-w-0 max-w-[240px]">
                                <p className="text-sm font-black text-slate-900 truncate">{doc.fileName}</p>
                                <p className="text-[11px] font-bold text-slate-400 truncate">{doc.tenant}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6">
                            <StatusBadge status={doc.status} />
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6 text-[11px] font-bold text-slate-500 hidden sm:table-cell">
                            {new Date(doc.receivedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6 font-black text-slate-900 text-sm">R {doc.amount}</td>
                          <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                            <ExternalLink className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* EMPTY STATE */}
                  {tableData.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-8">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <Inbox className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">No documents found</p>
                      {filterQuery && (
                        <p className="text-xs text-slate-400 mt-1">
                          Try adjusting your search query
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- THE MODAL (DRAWER) --- */}
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedDoc(null)} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="font-black text-slate-900 text-lg">Document Details</h2>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${selectedDoc.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}
                  >
                    <FileText size={28} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 leading-tight mb-1 truncate">{selectedDoc.fileName}</h3>
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

                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                    AI Extraction Insight
                  </p>
                  <p className="text-sm font-semibold text-slate-600 leading-relaxed italic">
                    {selectedDoc.status === 'SUCCESS'
                      ? 'The AI successfully matched this document to your existing records with 98% confidence.'
                      : 'The system flagged this entry due to an unclear amount format. Please review manually.'}
                  </p>
                </div>
              </div>

              <div className="p-6 border-t bg-slate-50/50 flex gap-3">
                <button className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-sm hover:bg-slate-800 transition-colors">
                  Download PDF
                </button>
                {selectedDoc.status === 'FAILED' && (
                  <button className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black text-sm hover:bg-indigo-700 transition-colors">
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

// HELPERS
const DetailBox = ({ icon, label, value }) => (
  <div className="p-4 bg-white border border-slate-100 rounded-2xl">
    <div className="flex items-center gap-2 text-slate-400 mb-1">
      {React.cloneElement(icon, { size: 14 })}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-sm font-black text-slate-900 truncate">{value}</p>
  </div>
);

const SidebarButton = ({ active, icon, label, count, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
  >
    <div className="flex items-center gap-3">
      {React.cloneElement(icon, { size: 18 })} <span className="font-bold text-sm">{label}</span>
    </div>
    {count > 0 && (
      <span
        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${active ? 'bg-white text-indigo-600' : 'bg-amber-500 text-white'}`}
      >
        {count}
      </span>
    )}
  </button>
);

const KPICard = ({ label, value, icon, status = 'default' }) => (
  <div className="bg-white p-6 md:p-7 rounded-2xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-center mb-6">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${status === 'success' ? 'bg-emerald-50' : status === 'warning' ? 'bg-amber-50' : 'bg-blue-50'}`}
      >
        {icon}
      </div>
      <div className="text-3xl font-black text-slate-900">{value ?? '0'}</div>
    </div>
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{label}</div>
  </div>
);

const StatusBadge = ({ status }) => (
  <span
    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
  >
    {status === 'SUCCESS' ? 'Processed' : 'Flagged'}
  </span>
);

const TabButton = ({ active, label, count, onClick }) => (
  <button
    onClick={onClick}
    className={`text-sm font-black pb-4 transition-all relative whitespace-nowrap ${active ? 'text-indigo-600' : 'text-slate-400'}`}
  >
    {label}{' '}
    {count !== undefined && <span className="ml-2 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">{count}</span>}
    {active && <span className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full" />}
  </button>
);

export default DashboardScreen;
