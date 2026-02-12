import React, { useState, useMemo } from 'react';
import {
  Search,
  Loader2,
  Landmark,
  X,
  Inbox,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useUtilityProviders, useDeleteUtilityProvider } from '../firebase';
import ProviderModal from './ProviderModal.jsx';

const TYPE_STYLES = {
  municipality: 'bg-navy-50 text-navy',
  eskom: 'bg-warning-light text-warning-dark',
  private: 'bg-bg-alt text-text-secondary',
};

const TYPE_LABELS = {
  municipality: 'Municipality',
  eskom: 'Eskom',
  private: 'Private',
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

const TypeBadge = ({ type }) => {
  const styles = TYPE_STYLES[type] || 'bg-bg-alt text-text-secondary';
  const label = TYPE_LABELS[type] || type || 'unknown';
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles}`}>
      {label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const styles =
    status === 'active'
      ? 'bg-success-light text-success'
      : 'bg-bg-alt text-text-secondary';
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles}`}>
      {status || 'unknown'}
    </span>
  );
};

const ProvidersScreen = () => {
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: providers, isLoading, isError } = useUtilityProviders();
  const deleteMutation = useDeleteUtilityProvider();

  const resultList = providers || [];

  const filtered = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return resultList;
    return resultList.filter((p) =>
      [p.name, p.type, p.contactEmail]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [resultList, searchInput]);

  const stats = useMemo(() => {
    const total = resultList.length;
    const municipalities = resultList.filter((p) => p.type === 'municipality').length;
    const eskom = resultList.filter((p) => p.type === 'eskom').length;
    const priv = resultList.filter((p) => p.type === 'private').length;
    return { total, municipalities, eskom, private: priv };
  }, [resultList]);

  const openCreate = () => {
    setEditingProvider(null);
    setModalOpen(true);
  };

  const openEdit = (provider) => {
    setEditingProvider(provider);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProvider(null);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteMutation.mutate(deleteConfirm.id, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  return (
    <>
      {/* DESKTOP HEADER */}
      <header className="h-16 bg-white border-b border-border hidden lg:flex items-center justify-between px-8 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Landmark className="w-5 h-5 text-accent" />
          <h1 className="font-bold text-text text-lg">Utility Providers</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search providers by name..."
              className="w-full bg-bg border-border border rounded-xl py-2 pl-12 pr-4 text-sm font-bold outline-none focus:border-accent transition-colors"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            onClick={openCreate}
            className="bg-accent text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-accent-hover transition-colors border border-transparent"
          >
            <Plus className="w-4 h-4" /> Add Provider
          </button>
        </div>
      </header>

      {/* MOBILE HEADER + SEARCH */}
      <div className="lg:hidden px-4 py-3 bg-white border-b border-border shrink-0 space-y-2">
        <div className="flex items-center gap-3">
          <Landmark className="w-5 h-5 text-accent" />
          <h1 className="font-bold text-text">Utility Providers</h1>
        </div>
        <div className="relative w-full">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search providers by name..."
            className="w-full bg-bg border-border border rounded-xl py-2 pl-10 pr-4 text-sm font-bold outline-none focus:border-accent transition-colors"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <button
          onClick={openCreate}
          className="w-full bg-accent text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Provider
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
            <p className="text-sm font-bold text-error">Failed to load providers</p>
            <p className="text-xs text-text-secondary mt-1">Please try again</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="Total Providers"
                value={stats.total}
                icon={<Landmark className="w-5 h-5 text-navy" />}
              />
              <KPICard
                label="Municipalities"
                value={stats.municipalities}
                icon={<Landmark className="w-5 h-5 text-accent" />}
                color="bg-accent-light"
              />
              <KPICard
                label="Eskom"
                value={stats.eskom}
                icon={<Landmark className="w-5 h-5 text-warning" />}
                color="bg-warning-light"
              />
              <KPICard
                label="Private"
                value={stats.private}
                icon={<Landmark className="w-5 h-5 text-text-secondary" />}
                color="bg-bg-alt"
              />
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
              <div className="px-4 md:px-8 py-5 border-b border-border bg-bg/30">
                <span className="text-sm font-bold text-text-secondary">
                  {filtered.length} {filtered.length === 1 ? 'Provider' : 'Providers'}
                  {searchInput.trim() && filtered.length !== resultList.length && (
                    <span className="text-text-secondary font-medium"> of {resultList.length}</span>
                  )}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                        Name
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                        Type
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest hidden sm:table-cell">
                        Status
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest w-24">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((provider) => (
                      <tr
                        key={provider.id}
                        className="hover:bg-bg transition-colors"
                      >
                        <td className="px-4 md:px-8 py-4 md:py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
                              <Landmark className="w-4 h-4 text-accent" />
                            </div>
                            <span className="text-sm font-bold text-text">
                              {provider.name || '\u2014'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-5">
                          <TypeBadge type={provider.type} />
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-5 hidden sm:table-cell">
                          <StatusBadge status={provider.status} />
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(provider)}
                              className="p-1.5 hover:bg-bg-alt rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5 text-text-secondary" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(provider)}
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

                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 px-8">
                    <div className="w-12 h-12 bg-bg-alt rounded-2xl flex items-center justify-center mb-4">
                      <Inbox className="w-6 h-6 text-text-secondary" />
                    </div>
                    <p className="text-sm font-bold text-text-secondary">
                      {searchInput.trim() ? 'No providers match your search' : 'No providers found'}
                    </p>
                    {searchInput.trim() && (
                      <p className="text-xs text-text-secondary mt-1">Try a different search term</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PROVIDER MODAL */}
      <ProviderModal
        isOpen={modalOpen}
        onClose={closeModal}
        provider={editingProvider}
      />

      {/* DELETE CONFIRMATION */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-dropdown p-6 max-w-sm w-full mx-4 animate-fade-in-scale">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-error-light flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-bold text-text">Delete provider?</h3>
                <p className="text-xs text-text-secondary">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              Are you sure you want to delete{' '}
              <span className="font-bold text-text">
                {deleteConfirm.name || 'this provider'}
              </span>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-white border border-border text-text py-2.5 rounded-xl font-bold text-sm hover:bg-bg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-error text-white py-2.5 rounded-xl font-bold text-sm hover:bg-error/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProvidersScreen;
