import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  Receipt,
  X,
  Inbox,
  Upload,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { useBills, useProperties } from '../firebase';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_extraction', label: 'Pending Extraction' },
  { value: 'pending_validation', label: 'Pending Validation' },
  { value: 'validated', label: 'Validated' },
  { value: 'allocated', label: 'Allocated' },
  { value: 'exception', label: 'Exception' },
];

const STATUS_STYLES = {
  pending_extraction: 'bg-bg-alt text-text-secondary',
  pending_validation: 'bg-warning-light text-warning-dark',
  validated: 'bg-success-light text-success',
  allocated: 'bg-accent-light text-accent',
  exception: 'bg-error-light text-error',
};

const STATUS_LABELS = {
  pending_extraction: 'Pending Extraction',
  pending_validation: 'Pending Validation',
  validated: 'Validated',
  allocated: 'Allocated',
  exception: 'Exception',
};

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

function formatDate(val) {
  if (!val) return '\u2014';
  if (val.toDate) val = val.toDate();
  if (val instanceof Date) {
    return val.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d)) return d.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  return String(val);
}

function formatCurrency(val) {
  if (val == null) return '\u2014';
  const n = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(n)) return '\u2014';
  return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const BillsScreen = ({ user }) => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: bills, isLoading, isError } = useBills();
  const { data: properties } = useProperties();

  const resultList = bills || [];
  const propertyList = properties || [];

  const propertyMap = useMemo(() => {
    const m = new Map();
    for (const p of propertyList) {
      m.set(p.id, p);
    }
    return m;
  }, [propertyList]);

  const filtered = useMemo(() => {
    let list = resultList;

    if (statusFilter) {
      list = list.filter((b) => b.status === statusFilter);
    }

    if (propertyFilter) {
      list = list.filter((b) => b.propertyId === propertyFilter);
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter((b) => {
        let d = b.billingPeriodStart || b.billDate;
        if (!d) return false;
        if (d.toDate) d = d.toDate();
        if (typeof d === 'string') d = new Date(d);
        return d >= from;
      });
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter((b) => {
        let d = b.billingPeriodEnd || b.billDate;
        if (!d) return false;
        if (d.toDate) d = d.toDate();
        if (typeof d === 'string') d = new Date(d);
        return d <= to;
      });
    }

    if (searchInput.trim()) {
      const q = searchInput.trim().toLowerCase();
      list = list.filter(
        (b) =>
          (b.invoiceNumber && b.invoiceNumber.toLowerCase().includes(q)) ||
          (b.bpNumber && b.bpNumber.toLowerCase().includes(q)) ||
          (b.providerName && b.providerName.toLowerCase().includes(q)) ||
          (b.id && b.id.toLowerCase().includes(q))
      );
    }

    return list;
  }, [resultList, statusFilter, propertyFilter, dateFrom, dateTo, searchInput]);

  const stats = useMemo(() => {
    const total = resultList.length;
    const pending = resultList.filter(
      (b) => b.status === 'pending_extraction' || b.status === 'pending_validation'
    ).length;
    const validated = resultList.filter((b) => b.status === 'validated' || b.status === 'allocated').length;
    const exceptions = resultList.filter((b) => b.status === 'exception').length;
    return { total, pending, validated, exceptions };
  }, [resultList]);

  const hasFilters = statusFilter || propertyFilter || dateFrom || dateTo;

  const clearFilters = () => {
    setStatusFilter('');
    setPropertyFilter('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <>
      {/* DESKTOP HEADER */}
      <header className="h-16 bg-white border-b border-border hidden lg:flex items-center justify-between px-8 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Receipt className="w-5 h-5 text-accent" />
          <h1 className="font-bold text-text text-lg">Bills</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search bills..."
              className="w-full bg-bg border-border border rounded-xl py-2 pl-12 pr-4 text-sm font-bold outline-none focus:border-accent transition-colors"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-accent-hover transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4" /> Upload Bill
          </button>
        </div>
      </header>

      {/* MOBILE HEADER */}
      <div className="lg:hidden px-4 py-3 bg-white border-b border-border shrink-0 space-y-2">
        <div className="flex items-center gap-3">
          <Receipt className="w-5 h-5 text-accent" />
          <h1 className="font-bold text-text">Bills</h1>
        </div>
        <div className="relative w-full">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search bills..."
            className="w-full bg-bg border-border border rounded-xl py-2 pl-10 pr-4 text-sm font-bold outline-none focus:border-accent transition-colors"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <button
          className="w-full bg-accent text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors"
        >
          <Upload className="w-3.5 h-3.5" /> Upload Bill
        </button>
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
            <p className="text-sm font-bold text-error">Failed to load bills</p>
            <p className="text-xs text-text-secondary mt-1">Please try again</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="Total Bills"
                value={stats.total}
                icon={<Receipt className="w-5 h-5 text-navy" />}
              />
              <KPICard
                label="Pending"
                value={stats.pending}
                icon={<Clock className="w-5 h-5 text-warning" />}
                color="bg-warning-light"
              />
              <KPICard
                label="Validated"
                value={stats.validated}
                icon={<CheckCircle2 className="w-5 h-5 text-success" />}
                color="bg-success-light"
              />
              <KPICard
                label="Exceptions"
                value={stats.exceptions}
                icon={<AlertTriangle className="w-5 h-5 text-error" />}
                color="bg-error-light"
              />
            </div>

            {/* FILTERS */}
            <div className="bg-white rounded-2xl border border-border shadow-card p-4 md:p-5">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-text-secondary" />
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Filters</span>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="ml-auto text-[10px] font-bold text-accent hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
                <div>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    placeholder="From"
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    placeholder="To"
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
              <div className="px-4 md:px-8 py-5 border-b border-border bg-bg/30">
                <span className="text-sm font-bold text-text-secondary">
                  {filtered.length} {filtered.length === 1 ? 'Bill' : 'Bills'}
                  {(searchInput.trim() || hasFilters) && filtered.length !== resultList.length && (
                    <span className="text-text-secondary font-medium"> of {resultList.length}</span>
                  )}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                        Invoice / ID
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                        Property
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest hidden sm:table-cell">
                        Provider
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest hidden md:table-cell">
                        Billing Period
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                        Amount
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest w-10">
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((bill) => {
                      const prop = bill.propertyId ? propertyMap.get(bill.propertyId) : null;
                      return (
                        <tr
                          key={bill.id}
                          className="hover:bg-bg transition-colors cursor-pointer"
                          onClick={() => navigate(`/bills/${bill.id}`)}
                        >
                          <td className="px-4 md:px-8 py-4 md:py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
                                <Receipt className="w-4 h-4 text-accent" />
                              </div>
                              <span className="text-sm font-bold text-text font-mono">
                                {bill.invoiceNumber || bill.id.slice(0, 8) + '...'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5 text-sm font-bold text-text">
                            {bill.bpNumber || prop?.bpNumber || '\u2014'}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5 text-sm font-bold text-text-secondary hidden sm:table-cell">
                            {bill.providerName || '\u2014'}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5 text-sm text-text-secondary hidden md:table-cell">
                            <span className="font-bold">
                              {formatDate(bill.billingPeriodStart)}
                            </span>
                            {(bill.billingPeriodStart || bill.billingPeriodEnd) && (
                              <span className="text-text-secondary font-medium"> – {formatDate(bill.billingPeriodEnd)}</span>
                            )}
                            {!bill.billingPeriodStart && !bill.billingPeriodEnd && '\u2014'}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5 text-sm font-bold text-text">
                            {formatCurrency(bill.totalAmount)}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-5">
                            <StatusBadge status={bill.status} />
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
                      {searchInput.trim() || hasFilters ? 'No bills match your filters' : 'No bills found'}
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
    </>
  );
};

export default BillsScreen;
