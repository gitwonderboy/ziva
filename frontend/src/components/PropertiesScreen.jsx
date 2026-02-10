import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  X,
  Loader2,
  Building2,
  ExternalLink,
  Inbox,
  LayoutGrid,
  List,
  Home,
  Users,
  Zap,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { searchProperties, upsertProperty } from '../services/api.js';
import {
  CHARGE_FIELDS,
  groupByProperty,
  getActiveCharges,
} from '../utils/propertyHelpers.js';

const EMPTY_FORM = {
  account_no: '',
  bp_number: '',
  sap_acc_no: '',
  tenant_name: '',
  municipality_raw: '',
  company: '',
  rates: '',
  electricity: '',
  water_sanitation: '',
  refuse_waste: '',
  effluent: '',
  siding_maintenance: '',
  sundry: '',
  dsw: '',
  levies: '',
  csos_levies: '',
  improvement_district: '',
  incentive_payment: '',
  interest_on_arrears: '',
  monthly_rental: '',
  security: '',
  deposit: '',
  meter_reading: '',
  general: '',
};

const ACCOUNT_FIELDS = [
  { key: 'account_no', label: 'Account No' },
  { key: 'bp_number', label: 'BP Number' },
  { key: 'sap_acc_no', label: 'SAP Acc No' },
  { key: 'tenant_name', label: 'Tenant Name' },
  { key: 'municipality_raw', label: 'Municipality' },
  { key: 'company', label: 'Company' },
];

const FormField = ({ label, value, onChange, readOnly }) => (
  <div>
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      className={`w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none transition-colors ${
        readOnly
          ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
          : 'bg-white text-slate-900 focus:border-indigo-500'
      }`}
    />
  </div>
);

const ChargeToggle = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
      active
        ? 'bg-indigo-600 text-white'
        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
    }`}
  >
    {label}
  </button>
);

const KPICard = ({ label, value, icon, color = 'bg-blue-50' }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-center mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
    </div>
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
  </div>
);

const PropertiesScreen = ({ user }) => {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saveError, setSaveError] = useState(null);
  const [viewMode, setViewMode] = useState('records');
  const [selectedProperty, setSelectedProperty] = useState(null);

  const { data: properties, isLoading, isError } = useQuery({
    queryKey: ['properties', 'search', searchQuery, user?.email],
    queryFn: () => searchProperties(searchQuery ?? '', user?.email),
    enabled: !!user?.email && searchQuery !== null,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => upsertProperty({ ...data, tenant_id: user?.email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties', 'search'] });
      closeDrawer();
    },
    onError: (err) => setSaveError(err.message),
  });

  const resultList = properties || [];

  const portfolio = useMemo(() => groupByProperty(resultList), [resultList]);

  const stats = useMemo(() => {
    const total = portfolio.length;
    const vacant = portfolio.filter((p) => p.is_vacant).length;
    return { total, occupied: total - vacant, vacant, accounts: resultList.length };
  }, [portfolio, resultList]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const browseAll = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleCharge = (key) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key]?.toUpperCase() === 'YES' ? '' : 'YES',
    }));
  };

  const openCreate = () => {
    setEditingProperty(null);
    setFormData(EMPTY_FORM);
    setSaveError(null);
    setDrawerOpen(true);
  };

  const openEdit = (property) => {
    setEditingProperty(property);
    const populated = { ...EMPTY_FORM };
    for (const key of Object.keys(EMPTY_FORM)) {
      if (property[key] !== undefined && property[key] !== null) {
        populated[key] = String(property[key]);
      }
    }
    setFormData(populated);
    setSaveError(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingProperty(null);
    setFormData(EMPTY_FORM);
    setSaveError(null);
  };

  const handleSave = () => {
    setSaveError(null);
    saveMutation.mutate(formData);
  };

  const isEditing = editingProperty !== null;
  const hasSearched = searchQuery !== null;

  return (
    <>
      {/* DESKTOP HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 hidden lg:flex items-center justify-between px-8 shrink-0 z-10">
        <form onSubmit={handleSearch} className="relative max-w-sm w-full flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search properties..."
              className="w-full bg-slate-50 border-slate-200 border rounded-xl py-2 pl-12 pr-4 text-sm font-bold outline-none focus:border-indigo-500 transition-colors"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
          <button
            type="button"
            onClick={browseAll}
            className="bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" /> Browse All
          </button>
        </form>

        <div className="flex items-center gap-3">
          {hasSearched && resultList.length > 0 && (
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('records')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'records' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('portfolio')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'portfolio' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}
          <button
            onClick={openCreate}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>
      </header>

      {/* MOBILE SEARCH */}
      <div className="lg:hidden px-4 py-3 bg-white border-b border-slate-200 shrink-0 space-y-2">
        <form onSubmit={handleSearch} className="relative w-full flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search properties..."
              className="w-full bg-slate-50 border-slate-200 border rounded-xl py-2 pl-10 pr-4 text-sm font-bold outline-none focus:border-indigo-500 transition-colors"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
        </form>
        <div className="flex gap-2">
          <button
            onClick={browseAll}
            className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Browse All
          </button>
          <button
            onClick={openCreate}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Property
          </button>
        </div>
        {hasSearched && resultList.length > 0 && (
          <div className="flex bg-slate-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => setViewMode('records')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${viewMode === 'records' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
            >
              Records
            </button>
            <button
              onClick={() => setViewMode('portfolio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${viewMode === 'portfolio' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
            >
              Portfolio
            </button>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {!hasSearched ? (
          <div className="flex flex-col items-center justify-center py-24 px-8">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-400 mb-4">Search for a property or browse all</p>
            <button
              onClick={browseAll}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-indigo-700 transition-colors"
            >
              Browse All Properties
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Searching...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-24 px-8">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-sm font-bold text-red-500">Failed to load properties</p>
            <p className="text-xs text-slate-400 mt-1">Please try again</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                label="Total Properties"
                value={stats.total}
                icon={<Building2 className="w-5 h-5 text-blue-600" />}
              />
              <KPICard
                label="Occupied"
                value={stats.occupied}
                icon={<Users className="w-5 h-5 text-emerald-600" />}
                color="bg-emerald-50"
              />
              <KPICard
                label="Vacant"
                value={stats.vacant}
                icon={<Home className="w-5 h-5 text-amber-600" />}
                color="bg-amber-50"
              />
              <KPICard
                label="Utility Accounts"
                value={stats.accounts}
                icon={<Zap className="w-5 h-5 text-indigo-600" />}
                color="bg-indigo-50"
              />
            </div>

            {viewMode === 'records' ? (
              /* FLAT TABLE VIEW */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-4 md:px-8 py-5 border-b border-slate-100 bg-slate-50/30">
                  <span className="text-sm font-black text-slate-600">
                    {resultList.length} {resultList.length === 1 ? 'Record' : 'Records'}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-4 md:px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Document</th>
                        <th className="px-4 md:px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account No</th>
                        <th className="px-4 md:px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Company</th>
                        <th className="px-4 md:px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">BP Number</th>
                        <th className="px-4 md:px-8 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {resultList.map((property, idx) => (
                        <tr
                          key={property.account_no || idx}
                          onClick={() => openEdit(property)}
                          className="hover:bg-slate-50 group cursor-pointer transition-colors"
                        >
                          <td className="px-4 md:px-8 py-4 md:py-6">
                            <div className="flex items-center gap-3 md:gap-4">
                              <Building2 className="w-5 h-5 shrink-0 text-indigo-500" />
                              <div className="min-w-0 max-w-[240px]">
                                <p className="text-sm font-black text-slate-900 truncate">
                                  {property.tenant_name || 'Unnamed'}
                                  {(property.tenant_name || '').toUpperCase() === 'VACANT' && (
                                    <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 uppercase">Vacant</span>
                                  )}
                                </p>
                                <p className="text-[11px] font-bold text-slate-400 truncate">
                                  {property.municipality_raw || '\u2014'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6 text-sm font-bold text-slate-700">
                            {property.account_no || '\u2014'}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6 text-sm font-bold text-slate-500 hidden sm:table-cell">
                            {property.company || '\u2014'}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6 text-sm font-bold text-slate-500 hidden sm:table-cell">
                            {property.bp_number || '\u2014'}
                          </td>
                          <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                            <ExternalLink className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {resultList.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-8">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <Inbox className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">No properties found</p>
                      <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* PORTFOLIO VIEW */
              <div>
                <div className="mb-4">
                  <span className="text-sm font-black text-slate-600">
                    {portfolio.length} {portfolio.length === 1 ? 'Property' : 'Properties'}
                  </span>
                </div>

                {portfolio.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-8 bg-white rounded-3xl border border-slate-200">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                      <Inbox className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">No properties found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {portfolio.map((prop) => {
                      const charges = prop.accounts.flatMap((a) => getActiveCharges(a));
                      const uniqueCharges = [...new Set(charges)];
                      return (
                        <div
                          key={prop.bp_number || prop.accounts[0]?.account_no}
                          onClick={() => setSelectedProperty(prop)}
                          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${prop.is_vacant ? 'bg-amber-50' : 'bg-indigo-50'}`}>
                                <Building2 className={`w-5 h-5 ${prop.is_vacant ? 'text-amber-600' : 'text-indigo-600'}`} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">BP {prop.bp_number || 'N/A'}</p>
                                <p className="text-[11px] font-bold text-slate-400">{prop.company || '\u2014'}</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-slate-600">{prop.tenant_name || 'Unknown'}</span>
                            {prop.is_vacant && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 uppercase">Vacant</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold mb-3">
                            <span>{prop.accounts.length} utility {prop.accounts.length === 1 ? 'account' : 'accounts'}</span>
                          </div>

                          {uniqueCharges.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {uniqueCharges.slice(0, 4).map((c) => (
                                <span key={c} className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500">{c}</span>
                              ))}
                              {uniqueCharges.length > 4 && (
                                <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-400">+{uniqueCharges.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PROPERTY DETAIL DRAWER (Portfolio click) */}
      {selectedProperty && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedProperty(null)} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-6 border-b flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-black text-slate-900 text-lg">BP {selectedProperty.bp_number || 'N/A'}</h2>
                <p className="text-xs font-bold text-slate-400">{selectedProperty.company || '\u2014'}</p>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedProperty.is_vacant ? 'bg-amber-50' : 'bg-indigo-50'}`}>
                  <Building2 className={`w-6 h-6 ${selectedProperty.is_vacant ? 'text-amber-600' : 'text-indigo-600'}`} />
                </div>
                <div>
                  <p className="font-black text-slate-900">{selectedProperty.tenant_name || 'Unknown'}</p>
                  {selectedProperty.is_vacant && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 uppercase">Vacant</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Utility Accounts ({selectedProperty.accounts.length})
                </h3>
                <div className="space-y-3">
                  {selectedProperty.accounts.map((acc, i) => {
                    const charges = getActiveCharges(acc);
                    return (
                      <div
                        key={acc.account_no || i}
                        className="bg-slate-50 rounded-xl p-4 border border-slate-100 cursor-pointer hover:border-indigo-200 transition-colors"
                        onClick={(e) => { e.stopPropagation(); openEdit(acc); }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-black text-slate-900">{acc.account_no}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 mb-2">{acc.municipality_raw || '\u2014'}</p>
                        {charges.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {charges.map((c) => (
                              <span key={c} className="px-2 py-0.5 bg-white rounded text-[9px] font-bold text-slate-500 border border-slate-100">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT/CREATE FORM DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
            <div className="p-6 border-b flex items-center justify-between shrink-0">
              <h2 className="font-black text-slate-900 text-lg">
                {isEditing ? 'Edit Property' : 'Add Property'}
              </h2>
              <button
                onClick={closeDrawer}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {/* Account Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Account Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {ACCOUNT_FIELDS.map((field) => (
                    <FormField
                      key={field.key}
                      label={field.label}
                      value={formData[field.key]}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      readOnly={isEditing && field.key === 'account_no'}
                    />
                  ))}
                </div>
              </div>

              {/* Charge Types as Toggles */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Charge Types
                </h4>
                <div className="flex flex-wrap gap-2">
                  {CHARGE_FIELDS.map(({ key, label }) => (
                    <ChargeToggle
                      key={key}
                      label={label}
                      active={formData[key]?.toUpperCase() === 'YES'}
                      onClick={() => toggleCharge(key)}
                    />
                  ))}
                </div>
              </div>

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-600">
                  {saveError}
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-slate-50/50 flex gap-3 shrink-0">
              <button
                onClick={closeDrawer}
                className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-black text-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {saveMutation.isPending ? 'Saving...' : 'Save Property'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertiesScreen;
