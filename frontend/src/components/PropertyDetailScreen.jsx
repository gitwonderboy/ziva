import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  X,
  Pencil,
  Trash2,
  Inbox,
  Zap,
  Search,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { useProperty, useUtilityAccountsByProperty, useDeleteUtilityAccount, useTenants } from '../firebase';
import PropertyModal from './PropertyModal.jsx';
import UtilityAccountModal from './UtilityAccountModal.jsx';

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

const PROPERTY_TYPE_LABELS = {
  office: 'Office',
  retail: 'Retail',
  industrial: 'Industrial',
  'mixed-use': 'Mixed-Use',
};

const OccupancyBadge = ({ tenantName }) => {
  if (tenantName) {
    return (
      <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-success-light text-success">
        {tenantName}
      </span>
    );
  }
  return (
    <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-warning-light text-warning-dark">
      Vacant
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

const PropertyDetailScreen = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(null);
  const [accountSearch, setAccountSearch] = useState('');

  const { data: property, isLoading, isError } = useProperty(id);
  const { data: accounts, isLoading: accountsLoading } = useUtilityAccountsByProperty(id);
  const { data: tenants } = useTenants();
  const deleteAccountMutation = useDeleteUtilityAccount();

  const accountList = accounts || [];

  // Find the tenant assigned to this property
  const assignedTenant = useMemo(() => {
    if (!tenants) return null;
    return tenants.find((t) => t.propertyId === id) || null;
  }, [tenants, id]);

  const openCreateAccount = () => {
    setEditingAccount(null);
    setAccountModalOpen(true);
  };

  const openEditAccount = (account) => {
    setEditingAccount(account);
    setAccountModalOpen(true);
  };

  const closeAccountModal = () => {
    setAccountModalOpen(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = () => {
    if (!deleteAccountConfirm) return;
    deleteAccountMutation.mutate(deleteAccountConfirm.id, {
      onSuccess: () => setDeleteAccountConfirm(null),
    });
  };

  const filteredAccounts = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) return accountList;
    return accountList.filter(
      (a) =>
        (a.providerName && a.providerName.toLowerCase().includes(q)) ||
        (a.accountNumber && a.accountNumber.toLowerCase().includes(q)) ||
        (a.sapAccountNumber && a.sapAccountNumber.toLowerCase().includes(q)) ||
        (a.tenantName && a.tenantName.toLowerCase().includes(q))
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

  if (isError || !property) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-bg font-sans px-8">
        <div className="w-16 h-16 bg-error-light rounded-2xl flex items-center justify-center mb-4">
          <X className="w-8 h-8 text-error" />
        </div>
        <p className="text-sm font-bold text-error">Property not found</p>
        <p className="text-xs text-text-secondary mt-1">This property may have been deleted</p>
        <button
          onClick={() => navigate('/dashboard?tab=properties')}
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
            onClick={() => navigate('/dashboard?tab=properties')}
            className="font-semibold text-text-secondary hover:text-accent transition-colors"
          >
            Properties
          </button>
          <ChevronRight className="w-3 h-3 text-text-secondary" />
          <span className="font-bold text-text">{property.bpNumber || property.name}</span>
        </div>

        {/* Title row */}
        <div className="px-4 md:px-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard?tab=properties')}
              className="p-2 hover:bg-bg-alt rounded-xl transition-colors"
              title="Back to Properties"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
              <Building2 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="font-bold text-text text-lg leading-tight">
                {property.name || property.bpNumber}
              </h1>
              {property.name && property.bpNumber && property.name !== property.bpNumber && (
                <p className="text-xs font-semibold text-text-secondary">{property.bpNumber}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-accent-hover transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Property
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {/* PROPERTY INFO CARD */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 md:p-8">
          <h2 className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-5">
            Property Details
          </h2>
          <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-5">
            <InfoItem label="Property ID" value={property.bpNumber} />
            <InfoItem label="Tenant Name" value={property.name} />
            <InfoItem
              label="Physical Address"
              value={
                [property.streetAddress, property.suburb, property.city, property.province, property.postalCode]
                  .filter(Boolean)
                  .join(', ') || null
              }
            />
            <InfoItem label="Property Owner" value={property.company} />
            <InfoItem
              label="GLA (m²)"
              value={property.gla != null ? Number(property.gla).toLocaleString() : null}
            />
            <InfoItem
              label="Property Type"
              value={PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType}
            />
            <div>
              <dt className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">
                Occupancy
              </dt>
              <dd>
                <OccupancyBadge tenantName={assignedTenant?.name} />
              </dd>
            </div>
          </dl>
          {property.description && (
            <div className="mt-6 pt-5 border-t border-border">
              <dt className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                Property Description
              </dt>
              <dd className="text-sm font-bold text-text leading-relaxed whitespace-pre-line">
                {property.description}
              </dd>
            </div>
          )}
        </div>

        {/* UTILITY ACCOUNTS SECTION */}
        <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
          <div className="px-4 md:px-8 py-5 border-b border-border bg-bg/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold text-text">
                Utility Accounts
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
              <button
                onClick={openCreateAccount}
                className="bg-accent text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-accent-hover transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
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
                      Tenant
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                      Utility Types
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest w-24">
                      Actions
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
                        {account.tenantName || '\u2014'}
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
                      <td className="px-4 md:px-8 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditAccount(account)}
                            className="p-1.5 hover:bg-bg-alt rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5 text-text-secondary" />
                          </button>
                          <button
                            onClick={() => setDeleteAccountConfirm(account)}
                            className="p-1.5 hover:bg-error-light rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-error" />
                          </button>
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
                  : 'No utility accounts for this property'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* EDIT PROPERTY MODAL */}
      <PropertyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        property={property}
      />

      {/* UTILITY ACCOUNT MODAL */}
      <UtilityAccountModal
        isOpen={accountModalOpen}
        onClose={closeAccountModal}
        utilityAccount={editingAccount}
        propertyId={id}
      />

      {/* DELETE ACCOUNT CONFIRMATION */}
      {deleteAccountConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setDeleteAccountConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-dropdown p-6 max-w-sm w-full mx-4 animate-fade-in-scale">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-error-light flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-bold text-text">Delete utility account?</h3>
                <p className="text-xs text-text-secondary">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              Are you sure you want to delete account{' '}
              <span className="font-bold text-text">
                {deleteAccountConfirm.accountNumber || 'this account'}
              </span>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteAccountConfirm(null)}
                className="flex-1 bg-white border border-border text-text py-2.5 rounded-xl font-bold text-sm hover:bg-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteAccountMutation.isPending}
                className="flex-1 bg-error text-white py-2.5 rounded-xl font-bold text-sm hover:bg-error/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleteAccountMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailScreen;
