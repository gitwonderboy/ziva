import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Loader2, Users, AlertTriangle } from 'lucide-react';
import {
  useTenantsByProperty,
  useCreateAllocation,
  useUpdateBill,
} from '../firebase';

const METHOD_OPTIONS = [
  { value: 'full_absorption', label: 'Full Absorption' },
  { value: 'gla_prorata', label: 'GLA Pro-Rata' },
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'percentage', label: 'Percentage' },
];

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

const AllocationModal = ({ isOpen, onClose, bill }) => {
  const billTotal = parseCurrency(bill?.totalAmount);
  const propertyId = bill?.propertyId;

  const { data: tenants, isLoading: tenantsLoading } = useTenantsByProperty(propertyId);
  const createAllocationMutation = useCreateAllocation();
  const updateBillMutation = useUpdateBill();

  const tenantList = tenants || [];

  // Each row: { tenantId, tenantName, method, amount, percentage }
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialise rows when tenants load or modal opens
  useEffect(() => {
    if (isOpen && tenantList.length > 0) {
      setRows(
        tenantList.map((t) => ({
          tenantId: t.id,
          tenantName: t.name || t.tradingName || t.id,
          gla: parseCurrency(t.gla),
          method: tenantList.length === 1 ? 'full_absorption' : 'percentage',
          amount: tenantList.length === 1 ? billTotal : 0,
          percentage: tenantList.length === 1 ? 100 : 0,
        })),
      );
      setErrors({});
      setSuccessMsg('');
      setSaving(false);
    }
  }, [isOpen, tenantList.length]);

  // Recalc when rows change methods but NOT during manual edits of amount/percentage
  const recalcRow = useCallback(
    (row, allRows) => {
      if (row.method === 'full_absorption') {
        return { ...row, percentage: 100, amount: billTotal };
      }
      if (row.method === 'gla_prorata') {
        const totalGla = allRows.reduce((s, r) => s + (r.gla || 0), 0);
        const pct = totalGla > 0 ? ((row.gla || 0) / totalGla) * 100 : 0;
        return {
          ...row,
          percentage: Math.round(pct * 100) / 100,
          amount: Math.round((pct / 100) * billTotal * 100) / 100,
        };
      }
      if (row.method === 'percentage') {
        return {
          ...row,
          amount: Math.round((row.percentage / 100) * billTotal * 100) / 100,
        };
      }
      // fixed — amount stays as-is, derive percentage
      return {
        ...row,
        percentage: billTotal > 0 ? Math.round((row.amount / billTotal) * 10000) / 100 : 0,
      };
    },
    [billTotal],
  );

  const updateRow = (index, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      const row = { ...next[index], [field]: value };

      if (field === 'method') {
        // Recalc this row and any gla_prorata rows
        next[index] = row;
        return next.map((r, i) => {
          if (i === index || r.method === 'gla_prorata') return recalcRow(i === index ? row : r, next);
          return r;
        });
      }

      if (field === 'percentage') {
        row.percentage = parseCurrency(value);
        row.amount = Math.round((row.percentage / 100) * billTotal * 100) / 100;
        next[index] = row;
        return next;
      }

      if (field === 'amount') {
        row.amount = parseCurrency(value);
        row.percentage = billTotal > 0 ? Math.round((row.amount / billTotal) * 10000) / 100 : 0;
        next[index] = row;
        return next;
      }

      next[index] = row;
      return next;
    });
    if (errors._form) setErrors({});
  };

  const allocatedTotal = useMemo(
    () => rows.reduce((s, r) => s + (r.amount || 0), 0),
    [rows],
  );

  const allocatedPct = useMemo(
    () => rows.reduce((s, r) => s + (r.percentage || 0), 0),
    [rows],
  );

  const difference = Math.round((allocatedTotal - billTotal) * 100) / 100;
  const isBalanced = Math.abs(difference) <= 0.02;

  const handleSubmit = async () => {
    if (rows.length === 0) {
      setErrors({ _form: 'No tenants to allocate to' });
      return;
    }

    const activeRows = rows.filter((r) => r.amount > 0);
    if (activeRows.length === 0) {
      setErrors({ _form: 'At least one tenant must have an amount greater than zero' });
      return;
    }

    if (!isBalanced) {
      setErrors({
        _form: `Allocations must equal the bill total. Difference: ${formatCurrency(difference)}`,
      });
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      // Create each allocation sequentially
      for (const row of activeRows) {
        await createAllocationMutation.mutateAsync({
          billId: bill.id,
          propertyId: bill.propertyId || null,
          tenantId: row.tenantId,
          tenantName: row.tenantName,
          method: row.method,
          percentage: row.percentage,
          amount: row.amount,
          status: 'pending',
        });
      }

      // Update bill status
      await updateBillMutation.mutateAsync({
        id: bill.id,
        data: { status: 'allocated' },
      });

      setSuccessMsg('Allocations created successfully');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch (err) {
      setErrors({ _form: err.message || 'Failed to create allocations' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent-light flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-accent" />
            </div>
            <h2 className="font-bold text-text text-lg">Allocate to Tenants</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-alt rounded-full transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
          {successMsg && (
            <div className="p-3 bg-success-light border border-success/30 rounded-xl text-sm font-bold text-success">
              {successMsg}
            </div>
          )}

          {errors._form && (
            <div className="p-3 bg-error-light border border-error/30 rounded-xl text-sm font-bold text-error flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {errors._form}
            </div>
          )}

          {/* Bill Summary */}
          <div className="bg-bg rounded-2xl border border-border p-5">
            <h3 className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Bill Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Property</p>
                <p className="text-sm font-bold text-text mt-0.5">{bill?.bpNumber || '\u2014'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Provider</p>
                <p className="text-sm font-bold text-text mt-0.5">{bill?.providerName || '\u2014'}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Total Amount</p>
                <p className="text-sm font-bold text-text mt-0.5">{formatCurrency(billTotal)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Period</p>
                <p className="text-sm font-bold text-text mt-0.5">
                  {formatDate(bill?.billingPeriodStart)} – {formatDate(bill?.billingPeriodEnd)}
                </p>
              </div>
            </div>
          </div>

          {/* Tenant Allocations */}
          {tenantsLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-accent animate-spin" />
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Loading</p>
            </div>
          ) : tenantList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="w-12 h-12 bg-bg-alt rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-text-secondary" />
              </div>
              <p className="text-sm font-bold text-text-secondary">No tenants found for this property</p>
              <p className="text-xs text-text-secondary mt-1">Add tenants to the property first</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                Tenant Allocations ({rows.length})
              </h3>

              {rows.map((row, i) => (
                <div
                  key={row.tenantId}
                  className="bg-white rounded-xl border border-border p-4 space-y-3"
                >
                  {/* Tenant name */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text">{row.tenantName}</span>
                    <span className="text-xs font-bold text-text-secondary font-mono">
                      {formatCurrency(row.amount)}
                    </span>
                  </div>

                  {/* Method + inputs */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-semibold text-text-secondary uppercase tracking-widest mb-1">
                        Method
                      </label>
                      <select
                        value={row.method}
                        onChange={(e) => updateRow(i, 'method', e.target.value)}
                        className="w-full border border-border rounded-lg px-2.5 py-2 text-xs font-bold outline-none transition-colors bg-white text-text focus:border-accent"
                      >
                        {METHOD_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-semibold text-text-secondary uppercase tracking-widest mb-1">
                        Percentage
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={row.percentage || ''}
                          onChange={(e) => updateRow(i, 'percentage', e.target.value)}
                          disabled={row.method === 'full_absorption' || row.method === 'gla_prorata'}
                          className="w-full border border-border rounded-lg px-2.5 py-2 pr-7 text-xs font-bold font-mono outline-none transition-colors bg-white text-text focus:border-accent disabled:bg-bg-alt disabled:text-text-secondary"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-secondary">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-semibold text-text-secondary uppercase tracking-widest mb-1">
                        Amount (R)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.amount || ''}
                        onChange={(e) => updateRow(i, 'amount', e.target.value)}
                        disabled={row.method === 'full_absorption' || row.method === 'gla_prorata' || row.method === 'percentage'}
                        className="w-full border border-border rounded-lg px-2.5 py-2 text-xs font-bold font-mono outline-none transition-colors bg-white text-text focus:border-accent disabled:bg-bg-alt disabled:text-text-secondary"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Running Total */}
          {rows.length > 0 && (
            <div className={`rounded-xl border p-4 ${isBalanced ? 'bg-success-light border-success/30' : 'bg-warning-light border-warning/30'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                  Allocation Summary
                </span>
                {isBalanced ? (
                  <span className="text-[10px] font-bold text-success uppercase tracking-wider">Balanced</span>
                ) : (
                  <span className="text-[10px] font-bold text-warning-dark uppercase tracking-wider">Unbalanced</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-text-secondary">Bill Total</p>
                  <p className="text-sm font-bold text-text font-mono">{formatCurrency(billTotal)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-text-secondary">Allocated</p>
                  <p className="text-sm font-bold text-text font-mono">
                    {formatCurrency(allocatedTotal)}
                    <span className="text-text-secondary ml-1 text-[10px]">
                      ({Math.round(allocatedPct * 100) / 100}%)
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-text-secondary">Difference</p>
                  <p className={`text-sm font-bold font-mono ${isBalanced ? 'text-success' : 'text-warning-dark'}`}>
                    {formatCurrency(difference)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-bg/50 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-border text-text py-3 rounded-xl font-bold text-sm hover:bg-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !!successMsg || rows.length === 0}
            className="flex-1 bg-accent text-white py-3 rounded-xl font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Allocating...' : 'Allocate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllocationModal;
