import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Loader2,
  Building2,
  X,
  Inbox,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { useProperties, useDeleteProperty, useTenants } from '../firebase';
import PropertyModal from './PropertyModal.jsx';

const KPICard = ({ label, value, icon, color = 'bg-navy-50' }) => (
  <div className="bg-white p-5 rounded-2xl border border-border shadow-card">
    <div className="flex justify-between items-center mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div className="text-2xl font-bold text-text">{value}</div>
    </div>
    <div className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">{label}</div>
  </div>
);

const OccupancyBadge = ({ tenantName }) => {
  if (tenantName) {
    return (
      <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-success-light text-success max-w-[180px] truncate">
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

const PropertiesScreen = ({ user }) => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { data: properties, isLoading, isError } = useProperties();
  const { data: tenants } = useTenants();
  const deleteMutation = useDeleteProperty();

  const resultList = properties || [];

  // Build a map: propertyId → tenant name (first active tenant found)
  const propertyTenantMap = useMemo(() => {
    const m = new Map();
    for (const t of (tenants || [])) {
      if (t.propertyId && !m.has(t.propertyId)) {
        m.set(t.propertyId, t.name);
      }
    }
    return m;
  }, [tenants]);

  const filtered = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return resultList;
    return resultList.filter((p) =>
      [p.bpNumber, p.name, p.company, p.physicalAddress, propertyTenantMap.get(p.id), ...(p.tenantNames || [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [resultList, searchInput, propertyTenantMap]);

  const stats = useMemo(() => {
    const total = resultList.length;
    const occupied = resultList.filter((p) => propertyTenantMap.has(p.id)).length;
    const vacant = total - occupied;
    return { total, occupied, vacant };
  }, [resultList, propertyTenantMap]);

  const openCreate = () => {
    setEditingProperty(null);
    setModalOpen(true);
  };

  const openEdit = (property) => {
    setEditingProperty(property);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProperty(null);
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
          <Building2 className="w-5 h-5 text-accent" />
          <h1 className="font-bold text-text text-lg">Properties</h1>
        </div>
      </header>

      {/* MOBILE HEADER + SEARCH */}
      <div className="lg:hidden px-4 py-3 bg-white border-b border-border shrink-0 space-y-2">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-accent" />
          <h1 className="font-bold text-text">Properties</h1>
        </div>
        <div className="relative w-full">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Property ID or tenant name..."
            className="w-full bg-bg border-border border rounded-xl py-2 pl-10 pr-4 text-sm font-bold outline-none focus:border-accent transition-colors"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <button
          onClick={openCreate}
          className="w-full bg-accent text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-accent-hover transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-8">
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
            <p className="text-sm font-bold text-error">Failed to load properties</p>
            <p className="text-xs text-text-secondary mt-1">Please try again</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 gap-6 overflow-hidden min-h-0">
            {/* KPI CARDS + ADD BUTTON */}
            <div className="flex items-end justify-between gap-4 shrink-0">
              <div className="grid grid-cols-3 gap-4 max-w-2xl flex-1">
                <KPICard
                  label="Total Properties"
                  value={stats.total}
                  icon={<Building2 className="w-5 h-5 text-navy" />}
                />
                <KPICard
                  label="Occupied"
                  value={stats.occupied}
                  icon={<Building2 className="w-5 h-5 text-success" />}
                  color="bg-success-light"
                />
                <KPICard
                  label="Vacant"
                  value={stats.vacant}
                  icon={<Building2 className="w-5 h-5 text-warning" />}
                  color="bg-warning-light"
                />
              </div>
              <button
                onClick={openCreate}
                className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold hidden lg:flex items-center gap-1.5 hover:bg-accent-hover transition-colors shrink-0 whitespace-nowrap mb-1"
              >
                <Plus className="w-4 h-4" /> Add Property
              </button>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden flex flex-col">
              <div className="px-4 md:px-8 py-4 border-b border-border bg-bg/30 shrink-0 flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-text-secondary whitespace-nowrap">
                  {filtered.length} {filtered.length === 1 ? 'Property' : 'Properties'}
                  {searchInput.trim() && filtered.length !== resultList.length && (
                    <span className="text-text-secondary font-medium"> of {resultList.length}</span>
                  )}
                </span>
                <div className="relative max-w-xs w-full hidden lg:block">
                  <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    className="w-full bg-white border-border border rounded-xl py-1.5 pl-9 pr-4 text-sm outline-none focus:border-accent transition-colors"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-y-auto max-h-[594px]">
                <table className="w-full text-left">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-border">
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                        Property ID
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                        Tenant Name
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest hidden sm:table-cell">
                        Property Owner
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest hidden sm:table-cell">
                        Occupancy
                      </th>
                      <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest w-24">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((property) => (
                      <tr
                        key={property.id}
                        className="h-[66px] hover:bg-bg transition-colors cursor-pointer"
                        onClick={() => navigate(`/properties/${property.id}`)}
                      >
                        <td className="px-4 md:px-8 py-4 md:py-5">
                          <div className="flex items-center gap-3">
                            <Building2 className="w-5 h-5 shrink-0 text-accent" />
                            <span className="text-sm font-bold text-text">
                              {property.bpNumber || '\u2014'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-5">
                          {property.tenantNames?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {property.tenantNames.map((n) => (
                                <span key={n} className="inline-flex px-2 py-0.5 rounded-md text-xs font-bold bg-accent-light text-accent">
                                  {n}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-text">{property.name || '\u2014'}</span>
                          )}
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-5 text-sm font-bold text-text-secondary hidden sm:table-cell">
                          {property.company || '\u2014'}
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-5 hidden sm:table-cell">
                          <OccupancyBadge tenantName={propertyTenantMap.get(property.id)} />
                        </td>
                        <td className="px-4 md:px-8 py-4 md:py-5">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openEdit(property)}
                              className="p-1.5 hover:bg-bg-alt rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5 text-text-secondary" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(property)}
                              className="p-1.5 hover:bg-error-light rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-error" />
                            </button>
                          </div>
                          <ChevronRight className="w-4 h-4 text-text-secondary ml-1 hidden sm:inline-block" />
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
                      {searchInput.trim() ? 'No properties match your search' : 'No properties found'}
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

      {/* PROPERTY MODAL */}
      <PropertyModal
        isOpen={modalOpen}
        onClose={closeModal}
        property={editingProperty}
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
                <h3 className="font-bold text-text">Delete property?</h3>
                <p className="text-xs text-text-secondary">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              Are you sure you want to delete{' '}
              <span className="font-bold text-text">
                {deleteConfirm.bpNumber || deleteConfirm.name || 'this property'}
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

export default PropertiesScreen;
