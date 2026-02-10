import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  Users,
  ChevronDown,
  ChevronUp,
  Building2,
  X,
  Home,
  UserCheck,
  Percent,
} from 'lucide-react';
import { searchProperties } from '../services/api.js';
import { groupByTenant, getActiveCharges } from '../utils/propertyHelpers.js';

const TenantsScreen = ({ user }) => {
  const [expandedTenant, setExpandedTenant] = useState(null);

  const { data: properties, isLoading, isError } = useQuery({
    queryKey: ['properties', 'search', '', user?.email],
    queryFn: () => searchProperties('', user?.email),
    enabled: !!user?.email,
  });

  const tenants = useMemo(
    () => groupByTenant(properties || []).sort((a, b) => b.properties.length - a.properties.length),
    [properties]
  );

  const stats = useMemo(() => {
    const total = tenants.length;
    const vacant = tenants.filter((t) => t.is_vacant).length;
    const totalProps = (properties || []).length;
    const vacantProps = (properties || []).filter((p) => (p.tenant_name || '').toUpperCase() === 'VACANT').length;
    const occupancyRate = totalProps > 0 ? (((totalProps - vacantProps) / totalProps) * 100).toFixed(1) : 0;
    return { total, vacant, totalProps, vacantProps, occupancyRate };
  }, [tenants, properties]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading tenants...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <X className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-sm font-bold text-red-500">Failed to load tenants</p>
      </div>
    );
  }

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 hidden lg:flex items-center px-8 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-indigo-600" />
          <h1 className="font-black text-slate-900 text-lg">Tenants</h1>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
            {stats.total} tenants
          </span>
        </div>
      </header>

      <div className="lg:hidden px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-indigo-600" />
          <h1 className="font-black text-slate-900">Tenants</h1>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {stats.total}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* VACANCY SUMMARY */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Tenants</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats.total - stats.vacant}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Active Tenants</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <Home className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600">{stats.vacantProps}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Vacant Properties</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Percent className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <div className="text-2xl font-black text-indigo-600">{stats.occupancyRate}%</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Occupancy Rate</div>
          </div>
        </div>

        {/* TENANT TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 md:px-8 py-5 border-b border-slate-100 bg-slate-50/30">
            <span className="text-sm font-black text-slate-600">
              {tenants.length} {tenants.length === 1 ? 'Tenant' : 'Tenants'}
            </span>
          </div>

          <div className="divide-y divide-slate-50">
            {tenants.map((tenant) => {
              const key = `${tenant.tenant_name}__${tenant.sap_acc_no}`;
              const isExpanded = expandedTenant === key;
              return (
                <div key={key}>
                  <div
                    className="flex items-center justify-between px-4 md:px-8 py-4 md:py-5 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => setExpandedTenant(isExpanded ? null : key)}
                  >
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tenant.is_vacant ? 'bg-amber-50' : 'bg-indigo-50'}`}>
                        <Users className={`w-5 h-5 ${tenant.is_vacant ? 'text-amber-600' : 'text-indigo-600'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-900 truncate">{tenant.tenant_name}</p>
                          {tenant.is_vacant && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 uppercase shrink-0">Vacant</span>
                          )}
                        </div>
                        <p className="text-[11px] font-bold text-slate-400">
                          SAP: {tenant.sap_acc_no || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs font-bold text-slate-400 hidden sm:block">
                        {tenant.properties.length} {tenant.properties.length === 1 ? 'property' : 'properties'}
                      </span>
                      <span className="text-xs font-bold text-slate-400 sm:hidden">
                        {tenant.properties.length}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-slate-50/50 border-t border-slate-100 px-4 md:px-8 py-4 space-y-2">
                      {tenant.properties.map((prop, i) => {
                        const charges = getActiveCharges(prop);
                        return (
                          <div key={prop.account_no || i} className="bg-white rounded-xl p-4 border border-slate-100">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-indigo-500" />
                                <span className="text-xs font-black text-slate-900">{prop.account_no}</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-400">BP {prop.bp_number || 'N/A'}</span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 mb-1">
                              {prop.municipality_raw || '\u2014'} &middot; {prop.company || '\u2014'}
                            </p>
                            {charges.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {charges.map((c) => (
                                  <span key={c} className="px-1.5 py-0.5 bg-slate-50 rounded text-[8px] font-bold text-slate-400 border border-slate-100">{c}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default TenantsScreen;
