import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  HandCoins,
  X,
  Inbox,
  ChevronRight,
  Clock,
  CheckCircle2,
  Send,
  Filter,
  Receipt,
} from 'lucide-react';
import { useAllocations, useProperties, useTenants, useBills } from '../firebase';

/* ── constants ── */

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending Invoice' },
  { value: 'invoiced', label: 'Invoiced' },
  { value: 'paid', label: 'Paid' },
];

const STATUS_STYLES = {
  pending: 'bg-warning-light text-warning-dark',
  invoiced: 'bg-accent-light text-accent',
  paid: 'bg-success-light text-success',
};

const STATUS_LABELS = {
  pending: 'Pending Invoice',
  invoiced: 'Invoiced',
  paid: 'Paid',
};

const METHOD_LABELS = {
  full_absorption: 'Full Absorption',
  gla_prorata: 'GLA Pro-Rata',
  fixed: 'Fixed',
  percentage: 'Percentage',
};

/* ── helpers ── */

const KPICard = ({ label, value, icon, color = 'bg-navy-50' }) => (
  <div className="bg-white p-5 rounded-2xl border border-border shadow-card">
    <div className="flex justify-between items-center mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div className="text-2xl font-bold text-text">{value}</div>
    </div>
    <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">{label}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = STATUS_STYLES[status] || 'bg-bg-alt text-text-secondary';
  const label = STATUS_LABELS[status] || status || 'unknown';
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${styles}`}>
      {label}
    </span>
  );
};

function formatCurrency(val) {
  if (val == null) return '\u2014';
  const n = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(n)) return '\u2014';
  return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(val) {
  if (!val) return '\u2014';
  if (val.toDate) val = val.toDate();
  if (val instanceof Date)
    return val.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d))
      return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return String(val);
}

function parseCurrency(val) {
  if (typeof val === 'number') return val;
  const n = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
}

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */

const AllocationsScreen = ({ user }) => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [selectedAlloc, setSelectedAlloc] = useState(null);

  const { data: allocations, isLoading, isError } = useAllocations();
  const { data: properties } = useProperties();
  const { data: tenants } = useTenants();
  const { data: bills } = useBills();

  const allocationList = allocations || [];
  const propertyList = properties || [];
  const tenantList = tenants || [];
  const billList = bills || [];

  const billMap = useMemo(() => {
    const m = new Map();
    for (const b of billList) m.set(b.id, b);
    return m;
  }, [billList]);

  const propertyMap = useMemo(() => {
    const m = new Map();
    for (const p of propertyList) m.set(p.id, p);
    return m;
  }, [propertyList]);

  // Deduplicate tenant dropdown options from allocations + tenants collection
  const tenantOptions = useMemo(() => {
    const seen = new Map();
    for (const t of tenantList) seen.set(t.id, t.name || t.tradingName || t.id);
    for (const a of allocationList) {
      if (a.tenantId && !seen.has(a.tenantId)) seen.set(a.tenantId, a.tenantName || a.tenantId);
    }
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [tenantList, allocationList]);

  const filtered = useMemo(() => {
    let list = allocationList;

    if (statusFilter) list = list.filter((a) => a.status === statusFilter);
    if (propertyFilter) list = list.filter((a) => a.propertyId === propertyFilter);
    if (tenantFilter) list = list.filter((a) => a.tenantId === tenantFilter);

    if (searchInput.trim()) {
      const q = searchInput.trim().toLowerCase();
      list = list.filter(
        (a) =>
          (a.tenantName && a.tenantName.toLowerCase().includes(q)) ||
          (a.billId && a.billId.toLowerCase().includes(q)) ||
          (a.tenantId && a.tenantId.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [allocationList, statusFilter, propertyFilter, tenantFilter, searchInput]);

  const stats = useMemo(() => {
    const totalAllocated = allocationList.reduce((s, a) => s + parseCurrency(a.amount), 0);
    const pending = allocationList.filter((a) => !a.status || a.status === 'pending').length;
    const invoiced = allocationList.filter((a) => a.status === 'invoiced').length;
    return { totalAllocated, pending, invoiced };
  }, [allocationList]);

  const hasFilters = statusFilter || propertyFilter || tenantFilter;

  const clearFilters = () => {
    setStatusFilter('');
    setPropertyFilter('');
    setTenantFilter('');
  };

  return (
    <>
      {/* DESKTOP HEADER */}
      <header className="h-16 bg-white border-b border-border hidden lg:flex items-center justify-between px-8 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <HandCoins className="w-5 h-5 text-accent" />
          <h1 className="font-bold text-text text-lg">Allocations</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search allocations..."
              className="w-full bg-bg border-border border rounded-xl py-2 pl-12 pr-4 text-sm font-bold outline-none focus:border-accent transition-colors"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* MOBILE HEADER */}
      <div className="lg:hidden px-4 py-3 bg-white border-b border-border shrink-0 space-y-2">
        <div className="flex items-center gap-3">
          <HandCoins className="w-5 h-5 text-accent" />
          <h1 className="font-bold text-text">Allocations</h1>
        </div>
        <div className="relative w-full">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search allocations..."
            className="w-full bg-bg border-border border rounded-xl py-2 pl-10 pr-4 text-sm font-bold outline-none focus:border-accent transition-colors"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Loading</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-24 px-8">
            <div className="w-16 h-16 bg-error-light rounded-2xl flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-error" />
            </div>
            <p className="text-sm font-bold text-error">Failed to load allocations</p>
            <p className="text-xs text-text-secondary mt-1">Please try again</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard
                label="Total Allocated"
                value={formatCurrency(stats.totalAllocated)}
                icon={<HandCoins className="w-5 h-5 text-navy" />}
              />
              <KPICard
                label="Pending Invoice"
                value={stats.pending}
                icon={<Clock className="w-5 h-5 text-warning" />}
                color="bg-warning-light"
              />
              <KPICard
                label="Invoiced"
                value={stats.invoiced}
                icon={<Send className="w-5 h-5 text-accent" />}
                color="bg-accent-light"
              />
            </div>

            {/* FILTERS */}
            <div className="bg-white rounded-2xl border border-border shadow-card p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-text-secondary" />
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Filters</span>
                {hasFilters && (
                  <button onClick={clearFilters} className="ml-auto text-[10px] font-bold text-accent hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  value={propertyFilter}
                  onChange={(e) => setPropertyFilter(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
                >
                  <option value="">All Properties</option>
                  {propertyList.map((p) => (
                    <option key={p.id} value={p.id}>{p.bpNumber || p.name}</option>
                  ))}
                </select>
                <select
                  value={tenantFilter}
                  onChange={(e) => setTenantFilter(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
                >
                  <option value="">All Tenants</option>
                  {tenantOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
              <div className="px-4 md:px-8 py-5 border-b border-border bg-bg/30">
                <span className="text-sm font-bold text-text-secondary">
                  {filtered.length} {filtered.length === 1 ? 'Allocation' : 'Allocations'}
                  {(searchInput.trim() || hasFilters) && filtered.length !== allocationList.length && (
                    <span className="text-text-secondary font-medium"> of {allocationList.length}</span>
                  )}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                        Bill Ref
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                        Property
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                        Tenant
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest hidden md:table-cell">
                        Method
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest text-right">
                        Amount
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest hidden lg:table-cell">
                        Period
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-4 md:px-8 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((alloc) => {
                      const bill = alloc.billId ? billMap.get(alloc.billId) : null;
                      const prop = alloc.propertyId ? propertyMap.get(alloc.propertyId) : null;
                      return (
                        <tr
                          key={alloc.id}
                          className="hover:bg-bg transition-colors cursor-pointer"
                          onClick={() => setSelectedAlloc(alloc)}
                        >
                          <td className="px-4 md:px-8 py-4 md:py-5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (alloc.billId) navigate(`/bills/${alloc.billId}`);
                              }}
                              className="flex items-center gap-2 text-sm font-bold text-accent hover:underline font-mono"
                            >
                              <Receipt className="w-3.5 h-3.5 shrink-0" />
                              {bill?.invoiceNumber || (alloc.billId ? alloc.billId.slice(0, 8) + '...' : '\u2014')}
                            </button>
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5 text-sm font-bold text-text">
                            {prop?.bpNumber || prop?.name || '\u2014'}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5 text-sm font-bold text-text">
                            {alloc.tenantName || '\u2014'}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5 text-sm font-bold text-text-secondary hidden md:table-cell">
                            {METHOD_LABELS[alloc.method] || alloc.method || '\u2014'}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5 text-sm font-bold text-text text-right font-mono">
                            {formatCurrency(alloc.amount)}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5 text-sm text-text-secondary hidden lg:table-cell">
                            {bill ? (
                              <>
                                <span className="font-bold">{formatDate(bill.billingPeriodStart)}</span>
                                {(bill.billingPeriodStart || bill.billingPeriodEnd) && (
                                  <span className="font-medium"> – {formatDate(bill.billingPeriodEnd)}</span>
                                )}
                                {!bill.billingPeriodStart && !bill.billingPeriodEnd && '\u2014'}
                              </>
                            ) : '\u2014'}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5">
                            <StatusBadge status={alloc.status || 'pending'} />
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5">
                            <ChevronRight className="w-4 h-4 text-text-secondary" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 px-8">
                    <div className="w-12 h-12 bg-bg-alt rounded-2xl flex items-center justify-center mb-4">
                      <Inbox className="w-6 h-6 text-text-secondary" />
                    </div>
                    <p className="text-sm font-bold text-text-secondary">
                      {searchInput.trim() || hasFilters ? 'No allocations match your filters' : 'No allocations found'}
                    </p>
                    {(searchInput.trim() || hasFilters) && (
                      <button
                        onClick={() => { setSearchInput(''); clearFilters(); }}
                        className="text-xs font-bold text-accent mt-2 hover:underline"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ ALLOCATION DETAIL DRAWER ═══ */}
      {selectedAlloc && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setSelectedAlloc(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
              <h2 className="font-bold text-text text-lg">Allocation Details</h2>
              <button
                onClick={() => setSelectedAlloc(null)}
                className="p-2 hover:bg-bg-alt rounded-full transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {/* Status */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-accent-light flex items-center justify-center">
                  <HandCoins className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-text text-base">{selectedAlloc.tenantName || 'Allocation'}</h3>
                  <StatusBadge status={selectedAlloc.status || 'pending'} />
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <DetailBox label="Tenant" value={selectedAlloc.tenantName} />
                <DetailBox label="Method" value={METHOD_LABELS[selectedAlloc.method] || selectedAlloc.method} />
                <DetailBox label="Percentage" value={selectedAlloc.percentage != null ? `${selectedAlloc.percentage}%` : null} />
                <DetailBox label="Amount" value={formatCurrency(selectedAlloc.amount)} />
              </div>

              {/* Bill link */}
              {selectedAlloc.billId && (() => {
                const bill = billMap.get(selectedAlloc.billId);
                return (
                  <div className="bg-bg rounded-2xl border border-border p-5 space-y-3">
                    <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                      Linked Bill
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Bill Ref</p>
                        <p className="text-sm font-bold text-accent font-mono mt-0.5">
                          {bill?.invoiceNumber || selectedAlloc.billId.slice(0, 8) + '...'}
                        </p>
                      </div>
                      {bill?.providerName && (
                        <div>
                          <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Provider</p>
                          <p className="text-sm font-bold text-text mt-0.5">{bill.providerName}</p>
                        </div>
                      )}
                      {bill?.totalAmount != null && (
                        <div>
                          <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Bill Total</p>
                          <p className="text-sm font-bold text-text mt-0.5 font-mono">{formatCurrency(bill.totalAmount)}</p>
                        </div>
                      )}
                      {(bill?.billingPeriodStart || bill?.billingPeriodEnd) && (
                        <div>
                          <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Period</p>
                          <p className="text-sm font-bold text-text mt-0.5">
                            {formatDate(bill.billingPeriodStart)} – {formatDate(bill.billingPeriodEnd)}
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/bills/${selectedAlloc.billId}`)}
                      className="text-xs font-bold text-accent flex items-center gap-1 hover:underline mt-2"
                    >
                      View Bill <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })()}

              {/* Property */}
              {selectedAlloc.propertyId && (() => {
                const prop = propertyMap.get(selectedAlloc.propertyId);
                return prop ? (
                  <div className="bg-bg rounded-2xl border border-border p-5">
                    <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-2">Property</p>
                    <p className="text-sm font-bold text-text">{prop.name || prop.bpNumber}</p>
                    {prop.bpNumber && prop.name && (
                      <p className="text-xs font-bold text-text-secondary mt-0.5 font-mono">{prop.bpNumber}</p>
                    )}
                  </div>
                ) : null;
              })()}
            </div>

            <div className="p-6 border-t border-border bg-bg/50 shrink-0">
              {selectedAlloc.billId && (
                <button
                  onClick={() => navigate(`/bills/${selectedAlloc.billId}`)}
                  className="w-full bg-navy text-white py-3 rounded-xl font-bold text-sm hover:bg-navy-hover transition-colors flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" /> View Bill
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ── inline helper ── */

const DetailBox = ({ label, value }) => (
  <div className="p-4 bg-white border border-border rounded-2xl">
    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1">{label}</p>
    <p className="text-sm font-bold text-text truncate">{value || '\u2014'}</p>
  </div>
);

export default AllocationsScreen;
