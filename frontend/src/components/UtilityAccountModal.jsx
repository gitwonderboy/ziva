import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import {
  useCreateUtilityAccount,
  useUpdateUtilityAccount,
  useUtilityProviders,
} from '../firebase';

const UTILITY_TYPE_OPTIONS = [
  { key: 'rates', label: 'Rates' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'water_sanitation', label: 'Water & Sanitation' },
  { key: 'refuse_waste', label: 'Refuse & Waste' },
  { key: 'effluent', label: 'Effluent' },
  { key: 'levies', label: 'Levies' },
  { key: 'csos_levies', label: 'CSOS Levies' },
  { key: 'improvement_district', label: 'Improvement District' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const EMPTY_FORM = {
  providerId: '',
  accountNumber: '',
  sapAccountNumber: '',
  utilityTypes: [],
  status: 'active',
};

const UtilityAccountModal = ({ isOpen, onClose, utilityAccount, propertyId }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const createMutation = useCreateUtilityAccount();
  const updateMutation = useUpdateUtilityAccount();
  const { data: providers } = useUtilityProviders();

  const providerList = providers || [];
  const isEditing = !!utilityAccount;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setSuccessMsg('');
      createMutation.reset();
      updateMutation.reset();

      if (utilityAccount) {
        setForm({
          providerId: utilityAccount.providerId || '',
          accountNumber: utilityAccount.accountNumber || '',
          sapAccountNumber: utilityAccount.sapAccountNumber || '',
          utilityTypes: utilityAccount.utilityTypes || [],
          status: utilityAccount.status || 'active',
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [isOpen, utilityAccount]);

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

  const toggleUtilityType = (key) => {
    setForm((prev) => {
      const types = prev.utilityTypes.includes(key)
        ? prev.utilityTypes.filter((t) => t !== key)
        : [...prev.utilityTypes, key];
      return { ...prev, utilityTypes: types };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!form.providerId) {
      newErrors.providerId = 'Provider is required';
    }
    if (!form.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const selectedProvider = providerList.find((p) => p.id === form.providerId);

    const payload = {
      providerId: form.providerId,
      providerName: selectedProvider?.name || '',
      accountNumber: form.accountNumber.trim(),
      sapAccountNumber: form.sapAccountNumber.trim(),
      utilityTypes: form.utilityTypes,
      status: form.status,
    };

    if (!isEditing) {
      payload.propertyId = propertyId;
    }

    const onSuccess = () => {
      setSuccessMsg(isEditing ? 'Account updated successfully' : 'Account created successfully');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    };

    const onError = (err) => {
      setErrors({ _form: err.message || 'Failed to save utility account' });
    };

    if (isEditing) {
      updateMutation.mutate({ id: utilityAccount.id, data: payload }, { onSuccess, onError });
    } else {
      createMutation.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <h2 className="font-bold text-text text-lg">
            {isEditing ? 'Edit Utility Account' : 'Add Utility Account'}
          </h2>
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

          {/* Provider */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Provider <span className="text-error">*</span>
            </label>
            <select
              value={form.providerId}
              onChange={(e) => handleChange('providerId', e.target.value)}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent ${
                errors.providerId ? 'border-error' : 'border-border'
              }`}
            >
              <option value="">Select a provider...</option>
              {providerList.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.providerId && (
              <p className="text-[11px] font-bold text-error mt-1">{errors.providerId}</p>
            )}
          </div>

          {/* Account Number + SAP Account row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                Account Number <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent ${
                  errors.accountNumber ? 'border-error' : 'border-border'
                }`}
              />
              {errors.accountNumber && (
                <p className="text-[11px] font-bold text-error mt-1">{errors.accountNumber}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                SAP Account Number
              </label>
              <input
                type="text"
                value={form.sapAccountNumber}
                onChange={(e) => handleChange('sapAccountNumber', e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
              />
            </div>
          </div>

          {/* Utility Types */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-2.5">
              Utility Types
            </label>
            <div className="grid grid-cols-2 gap-2">
              {UTILITY_TYPE_OPTIONS.map(({ key, label }) => {
                const checked = form.utilityTypes.includes(key);
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                      checked
                        ? 'border-accent bg-accent-light/50'
                        : 'border-border bg-white hover:bg-bg'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUtilityType(key)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors ${
                        checked ? 'bg-accent' : 'border-2 border-border bg-white'
                      }`}
                    >
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-bold text-text">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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
            className="flex-1 bg-accent text-white py-3 rounded-xl font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UtilityAccountModal;
