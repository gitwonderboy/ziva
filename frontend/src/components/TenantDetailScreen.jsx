import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  ChevronRight,
  ArrowLeft,
  Loader2,
  X,
  Pencil,
  Inbox,
  Zap,
  Search,
  Building2,
  HandCoins,
  Send,
  Receipt,
  FileText,
} from 'lucide-react';
import {
  useTenant,
  useUtilityAccountsByProperty,
  useAllocationsByTenant,
  useBills,
  useProperties,
} from '../firebase';
import TenantModal from './TenantModal.jsx';

const UTILITY_LABELS = {
  rates: 'Rates',
  electricity: 'Electricity',
  water_sanitation: 'Water & Sanitation',
  refuse_waste: 'Refuse & Waste',
  effluent: 'Effluent',
  dsw: 'DSW',
  levies: 'Levies',
  csos_levies: 'CSOS Levies',
  improvement_district: 'Improvement District',
};

const UTILITY_COLORS = {
  rates: 'bg-navy-50 text-navy',
  electricity: 'bg-warning-light text-warning-dark',
  water_sanitation: 'bg-accent-light text-accent',
  refuse_waste: 'bg-bg-alt text-text-secondary',
  effluent: 'bg-error-light text-error',
  dsw: 'bg-navy-50 text-navy',
  levies: 'bg-warning-light text-warning-dark',
  csos_levies: 'bg-accent-light text-accent',
  improvement_district: 'bg-bg-alt text-text-secondary',
};

const PropertyBadge = ({ propertyName }) => {
  if (propertyName) {
    return (
      <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-success-light text-success">
        {propertyName}
      </span>
    );
  }
  return (
    <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-warning-light text-warning-dark">
      Unassigned
    </span>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <dt className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">
      {label}
    </dt>
    <dd className="text-sm font-bold text-text">{value || '\u2014'}</dd>
  </div>
);

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

const TenantDetailScreen = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');

  const { data: tenant, isLoading, isError } = useTenant(id);
  const { data: allocations, isLoading: allocationsLoading } = useAllocationsByTenant(id);
  const { data: bills } = useBills();
  const { data: properties } = useProperties();

  // Utility accounts belong to the property, not the tenant.
  // Fetch accounts via the tenant's propertyId.
  const { data: accounts, isLoading: accountsLoading } = useUtilityAccountsByProperty(tenant?.propertyId);
  const accountList = accounts || [];
  const allocationList = allocations || [];

  const billMap = useMemo(() => {
    const m = new Map();
    for (const b of (bills || [])) m.set(b.id, b);
    return m;
  }, [bills]);

  const propertyMap = useMemo(() => {
    const m = new Map();
    for (const p of (properties || [])) m.set(p.id, p);
    return m;
  }, [properties]);

  const allocationTotal = useMemo(
    () => allocationList.reduce((s, a) => {
      const n = typeof a.amount === 'number' ? a.amount : parseFloat(a.amount);
      return s + (isNaN(n) ? 0 : n);
    }, 0),
    [allocationList],
  );

  const pendingAllocations = useMemo(
    () => allocationList.filter((a) => !a.status || a.status === 'pending'),
    [allocationList],
  );

  const filteredAccounts = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) return accountList;
    return accountList.filter(
      (a) =>
        (a.providerName && a.providerName.toLowerCase().includes(q)) ||
        (a.accountNumber && a.accountNumber.toLowerCase().includes(q)) ||
        (a.sapAccountNumber && a.sapAccountNumber.toLowerCase().includes(q)) ||
        (a.bpNumber && a.bpNumber.toLowerCase().includes(q))
    );
  }, [accountList, accountSearch]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-bg font-sans gap-4">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Loading</p>
      </div>
    );
  }

  if (isError || !tenant) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-bg font-sans px-8">
        <div className="w-16 h-16 bg-error-light rounded-2xl flex items-center justify-center mb-4">
          <X className="w-8 h-8 text-error" />
        </div>
        <p className="text-sm font-bold text-error">Tenant not found</p>
        <p className="text-xs text-text-secondary mt-1">This tenant may have been deleted</p>
        <button
          onClick={() => navigate('/dashboard?tab=tenants')}
          className="mt-4 text-sm font-bold text-accent hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-bg font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-border shrink-0 z-10">
        {/* Breadcrumb */}
        <div className="px-4 md:px-8 pt-4 pb-2 flex items-center gap-1.5 text-[11px]">
          <button
            onClick={() => navigate('/dashboard')}
            className="font-semibold text-text-secondary hover:text-accent transition-colors"
          >
            Dashboard
          </button>
          <ChevronRight className="w-3 h-3 text-text-secondary" />
          <button
            onClick={() => navigate('/dashboard?tab=tenants')}
            className="font-semibold text-text-secondary hover:text-accent transition-colors"
          >
            Tenants
          </button>
          <ChevronRight className="w-3 h-3 text-text-secondary" />
          <span className="font-bold text-text">{tenant.name}</span>
        </div>

        {/* Title row */}
        <div className="px-4 md:px-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard?tab=tenants')}
              className="p-2 hover:bg-bg-alt rounded-xl transition-colors"
              title="Back to Tenants"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="font-bold text-text text-lg leading-tight">
                {tenant.name}
              </h1>
              {tenant.tradingName && tenant.tradingName !== tenant.name && (
                <p className="text-xs font-semibold text-text-secondary">{tenant.tradingName}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-accent-hover transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Tenant
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {/* TENANT INFO CARD */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 md:p-8">
          <h2 className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-5">
            Tenant Details
          </h2>
          <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-5">
            <InfoItem label="Tenant Name" value={tenant.name} />
            <InfoItem label="Trading Name" value={tenant.tradingName} />
            <InfoItem label="Registration Number" value={tenant.registrationNumber} />
            <InfoItem label="VAT Number" value={tenant.vatNumber} />
            <InfoItem label="Contact Email" value={tenant.contactEmail} />
            <InfoItem label="Contact Phone" value={tenant.contactPhone} />
            <InfoItem label="Work Email" value={tenant.workEmail} />
            <InfoItem label="Work Phone" value={tenant.workPhone} />
            <div>
              <dt className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">
                Property
              </dt>
              <dd>
                <PropertyBadge propertyName={tenant.propertyId ? (propertyMap.get(tenant.propertyId)?.bpNumber || propertyMap.get(tenant.propertyId)?.name) : null} />
              </dd>
            </div>
          </dl>
          {(tenant.nextOfKinName || tenant.nextOfKinPhone || tenant.nextOfKinEmail) && (
            <div className="mt-6 pt-5 border-t border-border">
              <h3 className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-4">
                Next of Kin
              </h3>
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5">
                <InfoItem label="Full Name" value={tenant.nextOfKinName} />
                <InfoItem label="Relationship" value={tenant.nextOfKinRelationship} />
                <InfoItem label="Phone" value={tenant.nextOfKinPhone} />
                <InfoItem label="Email" value={tenant.nextOfKinEmail} />
              </dl>
            </div>
          )}
          {tenant.leaseAgreementUrl && (
            <div className="mt-6 pt-5 border-t border-border">
              <h3 className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-3">
                Lease Agreement
              </h3>
              <a
                href={tenant.leaseAgreementUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-4 py-3 bg-bg rounded-xl border border-border hover:border-accent transition-colors"
              >
                <FileText className="w-5 h-5 text-accent shrink-0" />
                <span className="text-sm font-bold text-accent hover:underline">
                  {tenant.leaseAgreementName || 'View Lease Agreement'}
                </span>
              </a>
            </div>
          )}
        </div>

        {/* UTILITY ACCOUNTS SECTION (read-only — accounts belong to the property) */}
        <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
          <div className="px-4 md:px-8 py-5 border-b border-border bg-bg/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold text-text">
                Property Utility Accounts
              </span>
              <span className="text-sm font-bold text-text-secondary">
                ({accountList.length})
              </span>
            </div>
            <div className="flex items-center gap-3">
              {accountList.length > 0 && (
                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    className="w-full bg-bg border-border border rounded-lg py-1.5 pl-9 pr-3 text-xs font-bold outline-none focus:border-accent transition-colors"
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                  />
                </div>
              )}
              {tenant?.propertyId && (
                <button
                  onClick={() => navigate(`/properties/${tenant.propertyId}`)}
                  className="bg-bg border border-border text-text px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:border-accent hover:text-accent transition-colors shrink-0"
                >
                  <Building2 className="w-3.5 h-3.5" /> View Property
                </button>
              )}
            </div>
          </div>

          {accountsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Loading</p>
            </div>
          ) : filteredAccounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                      Provider
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                      Account No.
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest hidden md:table-cell">
                      SAP Account
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest hidden lg:table-cell">
                      Property ID
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                      Utility Types
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-bg transition-colors">
                      <td className="px-4 md:px-8 py-4 text-sm font-bold text-text">
                        {account.providerName || '\u2014'}
                      </td>
                      <td className="px-4 md:px-8 py-4 text-sm font-bold text-text font-mono">
                        {account.accountNumber || '\u2014'}
                      </td>
                      <td className="px-4 md:px-8 py-4 text-sm font-bold text-text-secondary font-mono hidden md:table-cell">
                        {account.sapAccountNumber || '\u2014'}
                      </td>
                      <td className="px-4 md:px-8 py-4 text-sm font-bold text-text-secondary hidden lg:table-cell">
                        {account.bpNumber || '\u2014'}
                      </td>
                      <td className="px-4 md:px-8 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(account.utilityTypes || []).map((type) => (
                            <span
                              key={type}
                              className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide ${
                                UTILITY_COLORS[type] || 'bg-bg-alt text-text-secondary'
                              }`}
                            >
                              {UTILITY_LABELS[type] || type}
                            </span>
                          ))}
                          {(!account.utilityTypes || account.utilityTypes.length === 0) && (
                            <span className="text-xs text-text-secondary">{'\u2014'}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <div className="w-12 h-12 bg-bg-alt rounded-2xl flex items-center justify-center mb-4">
                <Inbox className="w-6 h-6 text-text-secondary" />
              </div>
              <p className="text-sm font-bold text-text-secondary">
                {accountSearch.trim()
                  ? 'No accounts match your search'
                  : tenant?.propertyId
                    ? 'No utility accounts on the assigned property'
                    : 'Tenant is not assigned to a property'}
              </p>
              {!tenant?.propertyId && (
                <p className="text-xs text-text-secondary mt-1">Assign this tenant to a property to see its utility accounts</p>
              )}
            </div>
          )}
        </div>

        {/* ALLOCATIONS HISTORY SECTION */}
        <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
          <div className="px-4 md:px-8 py-5 border-b border-border bg-bg/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold text-text">
                Allocations History
              </span>
              <span className="text-sm font-bold text-text-secondary">
                ({allocationList.length})
              </span>
            </div>
            <div className="flex items-center gap-3">
              {allocationList.length > 0 && (
                <div className="bg-bg rounded-lg px-3 py-1.5">
                  <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Total: </span>
                  <span className="text-sm font-bold text-text font-mono">
                    {formatCurrency(allocationTotal)}
                  </span>
                </div>
              )}
              {pendingAllocations.length > 0 && (
                <button
                  className="bg-accent text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-accent-hover transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> Generate Invoice
                </button>
              )}
            </div>
          </div>

          {allocationsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Loading</p>
            </div>
          ) : allocationList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                      Bill Period
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                      Property
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest hidden md:table-cell">
                      Provider
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest text-right">
                      Amount
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allocationList.map((alloc) => {
                    const bill = alloc.billId ? billMap.get(alloc.billId) : null;
                    const prop = alloc.propertyId ? propertyMap.get(alloc.propertyId) : null;
                    const allocStatusStyles = {
                      pending: 'bg-warning-light text-warning-dark',
                      invoiced: 'bg-accent-light text-accent',
                      paid: 'bg-success-light text-success',
                    };
                    const allocStatusLabels = {
                      pending: 'Pending',
                      invoiced: 'Invoiced',
                      paid: 'Paid',
                    };
                    const st = alloc.status || 'pending';
                    return (
                      <tr
                        key={alloc.id}
                        className="hover:bg-bg transition-colors cursor-pointer"
                        onClick={() => { if (alloc.billId) navigate(`/bills/${alloc.billId}`); }}
                      >
                        <td className="px-4 md:px-8 py-4">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span className="text-sm font-bold text-text">
                              {bill
                                ? `${formatDate(bill.billingPeriodStart)} – ${formatDate(bill.billingPeriodEnd)}`
                                : '\u2014'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 md:px-8 py-4 text-sm font-bold text-text">
                          {prop?.bpNumber || prop?.name || '\u2014'}
                        </td>
                        <td className="px-4 md:px-8 py-4 text-sm font-bold text-text-secondary hidden md:table-cell">
                          {bill?.providerName || '\u2014'}
                        </td>
                        <td className="px-4 md:px-8 py-4 text-sm font-bold text-text text-right font-mono">
                          {formatCurrency(alloc.amount)}
                        </td>
                        <td className="px-4 md:px-8 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${allocStatusStyles[st] || 'bg-bg-alt text-text-secondary'}`}>
                            {allocStatusLabels[st] || st}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <div className="w-12 h-12 bg-bg-alt rounded-2xl flex items-center justify-center mb-4">
                <HandCoins className="w-6 h-6 text-text-secondary" />
              </div>
              <p className="text-sm font-bold text-text-secondary">
                No allocations for this tenant
              </p>
            </div>
          )}
        </div>
      </div>

      {/* EDIT TENANT MODAL */}
      <TenantModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        tenant={tenant}
      />
    </div>
  );
};

export default TenantDetailScreen;
