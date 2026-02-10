import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  Landmark,
  Zap,
  ChevronDown,
  ChevronUp,
  MapPin,
  Building2,
  X,
} from 'lucide-react';
import { searchProperties } from '../services/api.js';
import {
  groupByProvider,
  getActiveCharges,
} from '../utils/propertyHelpers.js';

const TYPE_STYLES = {
  Municipality: 'bg-blue-100 text-blue-700',
  'National Utility': 'bg-amber-100 text-amber-700',
  Private: 'bg-slate-100 text-slate-600',
  Unknown: 'bg-slate-100 text-slate-400',
};

const ProvidersScreen = ({ user }) => {
  const [expandedProvider, setExpandedProvider] = useState(null);

  const { data: properties, isLoading, isError } = useQuery({
    queryKey: ['properties', 'search', '', user?.email],
    queryFn: () => searchProperties('', user?.email),
    enabled: !!user?.email,
  });

  const providers = useMemo(
    () => groupByProvider(properties || []),
    [properties]
  );

  const uniqueProperties = (accounts) => {
    const bps = new Set(accounts.map((a) => a.bp_number).filter(Boolean));
    return bps.size;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading providers...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-8">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <X className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-sm font-bold text-red-500">Failed to load providers</p>
      </div>
    );
  }

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 hidden lg:flex items-center px-8 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Landmark className="w-5 h-5 text-indigo-600" />
          <h1 className="font-black text-slate-900 text-lg">Utility Providers</h1>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
            {providers.length} providers
          </span>
        </div>
      </header>

      <div className="lg:hidden px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <Landmark className="w-5 h-5 text-indigo-600" />
          <h1 className="font-black text-slate-900">Utility Providers</h1>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {providers.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-2xl font-black text-slate-900">{providers.length}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Providers</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-2xl font-black text-blue-600">
              {providers.filter((p) => p.type === 'Municipality').length}
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Municipalities</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-2xl font-black text-amber-600">
              {providers.filter((p) => p.type === 'National Utility').length}
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">National Utility</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-2xl font-black text-slate-600">
              {providers.filter((p) => p.type === 'Private').length + providers.filter((p) => p.type === 'Unknown').length}
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Private / Other</div>
          </div>
        </div>

        {/* PROVIDER CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => {
            const isExpanded = expandedProvider === provider.name;
            const propCount = uniqueProperties(provider.accounts);
            return (
              <div
                key={provider.name}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                <div
                  className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedProvider(isExpanded ? null : provider.name)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <Landmark className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate">{provider.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${TYPE_STYLES[provider.type] || TYPE_STYLES.Unknown}`}>
                            {provider.type}
                          </span>
                          {provider.region !== 'Unknown' && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                              <MapPin className="w-3 h-3" /> {provider.region}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {propCount} properties</span>
                    <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> {provider.accounts.length} accounts</span>
                  </div>

                  {provider.chargeTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {provider.chargeTypes.slice(0, 5).map((c) => (
                        <span key={c} className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500">{c}</span>
                      ))}
                      {provider.chargeTypes.length > 5 && (
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-400">+{provider.chargeTypes.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-2 max-h-64 overflow-y-auto">
                    {provider.accounts.map((acc, i) => {
                      const charges = getActiveCharges(acc);
                      return (
                        <div key={acc.account_no || i} className="bg-white rounded-xl p-3 border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-slate-900">{acc.account_no}</span>
                            <span className="text-[10px] font-bold text-slate-400">BP {acc.bp_number || 'N/A'}</span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-500 mb-1">{acc.tenant_name || 'Unknown'}</p>
                          {charges.length > 0 && (
                            <div className="flex flex-wrap gap-1">
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
    </>
  );
};

export default ProvidersScreen;
