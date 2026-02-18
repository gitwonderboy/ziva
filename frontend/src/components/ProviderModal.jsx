import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateUtilityProvider, useUpdateUtilityProvider } from '../firebase';

const TYPE_OPTIONS = [
  { value: 'municipality', label: 'Municipality' },
  { value: 'eskom', label: 'Eskom' },
  { value: 'private', label: 'Private' },
];

const BILLING_CYCLE_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'bi-monthly', label: 'Bi-Monthly' },
];

const EMPTY_FORM = {
  name: '',
  shortName: '',
  type: 'municipality',
  billingCycle: 'monthly',
  contactPhone: '',
  contactEmail: '',
};

const ProviderModal = ({ isOpen, onClose, provider }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const createMutation = useCreateUtilityProvider();
  const updateMutation = useUpdateUtilityProvider();

  const isEditing = !!provider;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setSuccessMsg('');
      createMutation.reset();
      updateMutation.reset();

      if (provider) {
        setForm({
          name: provider.name || '',
          shortName: provider.shortName || '',
          type: provider.type || 'municipality',
          billingCycle: provider.billingCycle || 'monthly',
          contactPhone: provider.contactPhone || '',
          contactEmail: provider.contactEmail || '',
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [isOpen, provider]);

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
    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      shortName: form.shortName.trim(),
      type: form.type,
      billingCycle: form.billingCycle,
      contactPhone: form.contactPhone.trim(),
      contactEmail: form.contactEmail.trim(),
    };

    const onSuccess = () => {
      setSuccessMsg(isEditing ? 'Provider updated successfully' : 'Provider created successfully');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    };

    const onError = (err) => {
      setErrors({ _form: err.message || 'Failed to save provider' });
    };

    if (isEditing) {
      updateMutation.mutate({ id: provider.id, data: payload }, { onSuccess, onError });
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
            {isEditing ? 'Edit Provider' : 'Add Provider'}
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

          {/* Name */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent ${
                errors.name ? 'border-error' : 'border-border'
              }`}
            />
            {errors.name && (
              <p className="text-[11px] font-bold text-error mt-1">{errors.name}</p>
            )}
          </div>

          {/* Short Name */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Short Name
            </label>
            <input
              type="text"
              value={form.shortName}
              onChange={(e) => handleChange('shortName', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
            />
          </div>

          {/* Type + Billing Cycle row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                Type
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
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                Billing Cycle
              </label>
              <select
                value={form.billingCycle}
                onChange={(e) => handleChange('billingCycle', e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
              >
                {BILLING_CYCLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Email + Phone row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                Contact Email
              </label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                Contact Phone
              </label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
              />
            </div>
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
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Provider'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderModal;
