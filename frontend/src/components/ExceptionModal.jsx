import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { useCreateException, useUpdateBill } from '../firebase';

const TYPE_OPTIONS = [
  { value: 'extraction_error', label: 'Extraction Error' },
  { value: 'validation_failure', label: 'Validation Failure' },
  { value: 'reconciliation_break', label: 'Reconciliation Break' },
  { value: 'missing_data', label: 'Missing Data' },
  { value: 'other', label: 'Other' },
];

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const SEVERITY_COLORS = {
  critical: 'bg-error-light text-error',
  high: 'bg-warning-light text-warning-dark',
  medium: 'bg-navy-50 text-navy',
  low: 'bg-bg-alt text-text-secondary',
};

const EMPTY_FORM = {
  type: 'extraction_error',
  severity: 'medium',
  description: '',
  assignedTo: '',
};

const ExceptionModal = ({ isOpen, onClose, billId, propertyId }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const createExceptionMutation = useCreateException();
  const updateBillMutation = useUpdateBill();

  const isSaving = createExceptionMutation.isPending || updateBillMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setSuccessMsg('');
      createExceptionMutation.reset();
      updateBillMutation.reset();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.description.trim()) {
      newErrors.description = 'Description is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      billId,
      propertyId: propertyId || null,
      type: form.type,
      severity: form.severity,
      description: form.description.trim(),
      assignedTo: form.assignedTo.trim() || null,
      status: 'open',
    };

    createExceptionMutation.mutate(payload, {
      onSuccess: () => {
        updateBillMutation.mutate(
          { id: billId, data: { status: 'exception' } },
          {
            onSuccess: () => {
              setSuccessMsg('Exception created successfully');
              setTimeout(() => {
                setSuccessMsg('');
                onClose();
              }, 1200);
            },
            onError: (err) => {
              setErrors({ _form: err.message || 'Failed to update bill status' });
            },
          },
        );
      },
      onError: (err) => {
        setErrors({ _form: err.message || 'Failed to create exception' });
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-warning-light flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-warning-dark" />
            </div>
            <h2 className="font-bold text-text text-lg">Flag Exception</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg-alt rounded-full transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
          {successMsg && (
            <div className="p-3 bg-success-light border border-success/30 rounded-xl text-sm font-bold text-success">
              {successMsg}
            </div>
          )}

          {errors._form && (
            <div className="p-3 bg-error-light border border-error/30 rounded-xl text-sm font-bold text-error">
              {errors._form}
            </div>
          )}

          {/* Exception Type */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Exception Type
            </label>
            <select
              value={form.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-2.5">
              Severity
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SEVERITY_OPTIONS.map(({ value, label }) => {
                const selected = form.severity === value;
                const colors = SEVERITY_COLORS[value];
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleChange('severity', value)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wide transition-colors ${
                      selected
                        ? `${colors} border-current`
                        : 'border-border bg-white text-text-secondary hover:bg-bg'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Description <span className="text-error">*</span>
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the issue in detail..."
              className={`w-full border rounded-xl px-4 py-3 text-sm font-bold text-text outline-none transition-colors resize-none focus:border-accent ${
                errors.description ? 'border-error' : 'border-border'
              }`}
            />
            {errors.description && (
              <p className="text-[11px] font-bold text-error mt-1">{errors.description}</p>
            )}
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Assigned To <span className="text-text-secondary font-medium">(optional)</span>
            </label>
            <input
              type="text"
              value={form.assignedTo}
              onChange={(e) => handleChange('assignedTo', e.target.value)}
              placeholder="Name or email..."
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
            />
          </div>
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
            disabled={isSaving || !!successMsg}
            className="flex-1 bg-warning text-white py-3 rounded-xl font-bold text-sm hover:bg-warning/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Create Exception'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExceptionModal;
