import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Receipt,
  ChevronRight,
  ArrowLeft,
  Loader2,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Gauge,
  FileText,
  Flag,
} from 'lucide-react';
import {
  useBill,
  useProperty,
  useUtilityAccount,
  useUtilityProvider,
  useUpdateBill,
  useDeleteBill,
} from '../firebase';
import ExceptionModal from './ExceptionModal.jsx';

/* ── Status helpers ── */

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

const StatusBadge = ({ status, large }) => {
  const styles = STATUS_STYLES[status] || 'bg-bg-alt text-text-secondary';
  const label = STATUS_LABELS[status] || status || 'unknown';
  const sizeClasses = large
    ? 'px-4 py-1.5 text-xs'
    : 'px-2.5 py-1 text-[10px]';
  return (
    <span
      className={`inline-flex rounded-full font-bold uppercase tracking-wide whitespace-nowrap ${sizeClasses} ${styles}`}
    >
      {label}
    </span>
  );
};

/* ── Formatting helpers ── */

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

function toDateObj(val) {
  if (!val) return null;
  if (val.toDate) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === 'string') { const d = new Date(val); return isNaN(d) ? null : d; }
  return null;
}

function calcBillingDays(start, end) {
  const a = toDateObj(start);
  const b = toDateObj(end);
  if (!a || !b) return null;
  const diff = Math.round((b - a) / 86400000);
  return diff > 0 ? diff : null;
}

/* ── InfoItem ── */

const InfoItem = ({ label, value, large, mono }) => (
  <div>
    <dt className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">
      {label}
    </dt>
    <dd
      className={`font-bold text-text ${large ? 'text-2xl' : 'text-sm'} ${mono ? 'font-mono' : ''}`}
    >
      {value || '\u2014'}
    </dd>
  </div>
);

/* ════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════ */

const BillDetailScreen = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);

  const { data: bill, isLoading, isError } = useBill(id);
  const { data: property } = useProperty(bill?.propertyId);
  const { data: utilityAccount } = useUtilityAccount(bill?.utilityAccountId);
  const { data: provider } = useUtilityProvider(bill?.providerId);

  const updateMutation = useUpdateBill();
  const deleteMutation = useDeleteBill();

  /* derived */
  const billingDays = useMemo(
    () => calcBillingDays(bill?.billingPeriodStart, bill?.billingPeriodEnd),
    [bill?.billingPeriodStart, bill?.billingPeriodEnd],
  );

  const lineItems = bill?.lineItems || [];
  const meterReadings = bill?.meterReadings || [];
  const providerName = bill?.providerName || provider?.name || '\u2014';
  const propertyName = property?.name || property?.bpNumber || bill?.bpNumber || '\u2014';
  const bpNumber = property?.bpNumber || bill?.bpNumber || '\u2014';
  const accountNumber = utilityAccount?.accountNumber || bill?.accountNumber || '\u2014';

  /* ── actions ── */

  const handleValidate = () => {
    updateMutation.mutate({ id, data: { status: 'validated' } });
  };

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => navigate(-1),
    });
  };

  /* ── loading / error states ── */

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-bg font-sans gap-4">
        <Loader2 className="w-10 h-10 text-accent animate-spin" />
        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Loading bill...</p>
      </div>
    );
  }

  if (isError || !bill) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-bg font-sans px-8">
        <div className="w-16 h-16 bg-error-light rounded-2xl flex items-center justify-center mb-4">
          <X className="w-8 h-8 text-error" />
        </div>
        <p className="text-sm font-bold text-error">Bill not found</p>
        <p className="text-xs text-text-secondary mt-1">This bill may have been deleted</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-sm font-bold text-accent hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const canValidate = bill.status === 'pending_validation' || bill.status === 'pending_extraction';

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-bg font-sans">
      {/* ═══ HEADER ═══ */}
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
            onClick={() => navigate(-1)}
            className="font-semibold text-text-secondary hover:text-accent transition-colors"
          >
            Bills
          </button>
          <ChevronRight className="w-3 h-3 text-text-secondary" />
          <span className="font-bold text-text">
            Bill #{bill.invoiceNumber || id.slice(0, 8)}
          </span>
        </div>

        {/* Title row */}
        <div className="px-4 md:px-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-bg-alt rounded-xl transition-colors"
              title="Back to Bills"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
              <Receipt className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="font-bold text-text text-lg leading-tight">
                Bill #{bill.invoiceNumber || id.slice(0, 8)}
              </h1>
              <p className="text-xs font-semibold text-text-secondary">{providerName}</p>
            </div>
          </div>
          <StatusBadge status={bill.status} large />
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {/* ── SECTION 1: Bill Overview ── */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 md:p-8">
          <h2 className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-5">
            Bill Overview
          </h2>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5">
            <InfoItem label="Property" value={propertyName} />
            <InfoItem label="BP Number" value={bpNumber} mono />
            <InfoItem label="Provider" value={providerName} />
            <InfoItem label="Account Number" value={accountNumber} mono />
          </dl>
        </div>

        {/* ── SECTION 2: Billing Details ── */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 md:p-8">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="w-4 h-4 text-text-secondary" />
            <h2 className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
              Billing Details
            </h2>
          </div>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5">
            <div>
              <dt className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1">
                Billing Period
              </dt>
              <dd className="text-sm font-bold text-text">
                {formatDate(bill.billingPeriodStart)} – {formatDate(bill.billingPeriodEnd)}
              </dd>
            </div>
            <InfoItem
              label="Billing Days"
              value={billingDays != null ? `${billingDays} days` : null}
            />
            <InfoItem label="Bill Date" value={formatDate(bill.billDate)} />
            <InfoItem label="Due Date" value={formatDate(bill.dueDate)} />
          </dl>

          {/* Total amount highlight */}
          <div className="mt-6 pt-6 border-t border-border">
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5">
              <InfoItem label="Total Amount" value={formatCurrency(bill.totalAmount)} large />
              {bill.subtotal != null && (
                <InfoItem label="Subtotal" value={formatCurrency(bill.subtotal)} />
              )}
              {bill.vatAmount != null && (
                <InfoItem label="VAT" value={formatCurrency(bill.vatAmount)} />
              )}
              {bill.balanceDue != null && (
                <InfoItem label="Balance Due" value={formatCurrency(bill.balanceDue)} />
              )}
            </dl>
          </div>
        </div>

        {/* ── SECTION 3: Line Items ── */}
        {lineItems.length > 0 && (
          <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
            <div className="px-4 md:px-8 py-5 border-b border-border bg-bg/30 flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold text-text">
                Line Items
              </span>
              <span className="text-sm font-bold text-text-secondary">
                ({lineItems.length})
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                      Description
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest text-right">
                      Quantity
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest text-right">
                      Unit Price
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineItems.map((item, i) => (
                    <tr key={i} className="hover:bg-bg transition-colors">
                      <td className="px-4 md:px-8 py-4 text-sm font-bold text-text">
                        {item.description || '\u2014'}
                      </td>
                      <td className="px-4 md:px-8 py-4 text-sm font-bold text-text-secondary text-right font-mono">
                        {item.quantity != null ? item.quantity : '\u2014'}
                      </td>
                      <td className="px-4 md:px-8 py-4 text-sm font-bold text-text-secondary text-right font-mono">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 md:px-8 py-4 text-sm font-bold text-text text-right font-mono">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-border">
                  {bill.subtotal != null && (
                    <tr>
                      <td colSpan={3} className="px-4 md:px-8 py-3 text-sm font-bold text-text-secondary text-right">
                        Subtotal
                      </td>
                      <td className="px-4 md:px-8 py-3 text-sm font-bold text-text text-right font-mono">
                        {formatCurrency(bill.subtotal)}
                      </td>
                    </tr>
                  )}
                  {bill.vatAmount != null && (
                    <tr>
                      <td colSpan={3} className="px-4 md:px-8 py-3 text-sm font-bold text-text-secondary text-right">
                        VAT
                      </td>
                      <td className="px-4 md:px-8 py-3 text-sm font-bold text-text text-right font-mono">
                        {formatCurrency(bill.vatAmount)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="px-4 md:px-8 py-3 text-sm font-bold text-text text-right">
                      Total
                    </td>
                    <td className="px-4 md:px-8 py-3 text-base font-bold text-text text-right font-mono">
                      {formatCurrency(bill.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* ── SECTION 4: Meter Readings ── */}
        {meterReadings.length > 0 && (
          <div className="bg-white rounded-3xl border border-border shadow-card overflow-hidden">
            <div className="px-4 md:px-8 py-5 border-b border-border bg-bg/30 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold text-text">
                Meter Readings
              </span>
              <span className="text-sm font-bold text-text-secondary">
                ({meterReadings.length})
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
                      Meter Number
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest text-right">
                      Previous Reading
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest text-right">
                      Current Reading
                    </th>
                    <th className="px-4 md:px-8 py-3 text-[10px] font-semibold text-text-secondary uppercase tracking-widest text-right">
                      Consumption
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {meterReadings.map((reading, i) => {
                    const consumption =
                      reading.consumption != null
                        ? reading.consumption
                        : reading.currentReading != null && reading.previousReading != null
                          ? reading.currentReading - reading.previousReading
                          : null;
                    return (
                      <tr key={i} className="hover:bg-bg transition-colors">
                        <td className="px-4 md:px-8 py-4 text-sm font-bold text-text font-mono">
                          {reading.meterNumber || '\u2014'}
                        </td>
                        <td className="px-4 md:px-8 py-4 text-sm font-bold text-text-secondary text-right font-mono">
                          {reading.previousReading != null ? Number(reading.previousReading).toLocaleString() : '\u2014'}
                        </td>
                        <td className="px-4 md:px-8 py-4 text-sm font-bold text-text-secondary text-right font-mono">
                          {reading.currentReading != null ? Number(reading.currentReading).toLocaleString() : '\u2014'}
                        </td>
                        <td className="px-4 md:px-8 py-4 text-sm font-bold text-text text-right font-mono">
                          {consumption != null ? (
                            <>
                              {Number(consumption).toLocaleString()}
                              {reading.unit && (
                                <span className="text-text-secondary ml-1 text-xs">{reading.unit}</span>
                              )}
                            </>
                          ) : '\u2014'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SECTION 5: Actions ── */}
        <div className="bg-white rounded-2xl border border-border shadow-card p-6 md:p-8">
          <h2 className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-5">
            Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            {canValidate && (
              <button
                onClick={handleValidate}
                disabled={updateMutation.isPending}
                className="bg-success text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-success/90 transition-colors disabled:opacity-60"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Validate Bill
              </button>
            )}
            {bill.status !== 'exception' && (
              <button
                onClick={() => setExceptionModalOpen(true)}
                className="bg-warning text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-warning/90 transition-colors"
              >
                <Flag className="w-4 h-4" /> Flag Exception
              </button>
            )}
            <button
              onClick={() => {/* placeholder — BillModal can be wired here later */}}
              className="bg-navy text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-navy-hover transition-colors"
            >
              <Pencil className="w-4 h-4" /> Edit Bill
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="bg-white border border-error text-error px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-error-light transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete Bill
            </button>
          </div>
        </div>
      </div>

      {/* ═══ DELETE CONFIRMATION ═══ */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-dropdown p-6 max-w-sm w-full mx-4 animate-fade-in-scale">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-error-light flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-bold text-text">Delete this bill?</h3>
                <p className="text-xs text-text-secondary">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              Are you sure you want to delete bill{' '}
              <span className="font-bold text-text">
                #{bill.invoiceNumber || id.slice(0, 8)}
              </span>
              ?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
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

      {/* ═══ EXCEPTION MODAL ═══ */}
      <ExceptionModal
        isOpen={exceptionModalOpen}
        onClose={() => setExceptionModalOpen(false)}
        billId={id}
        propertyId={bill.propertyId}
      />
    </div>
  );
};

export default BillDetailScreen;
