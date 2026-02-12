import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateTenant, useUpdateTenant } from '../firebase';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const EMPTY_FORM = {
  name: '',
  tradingName: '',
  registrationNumber: '',
  vatNumber: '',
  contactEmail: '',
  contactPhone: '',
  status: 'active',
};

const TenantModal = ({ isOpen, onClose, tenant }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const createMutation = useCreateTenant();
  const updateMutation = useUpdateTenant();

  const isEditing = !!tenant;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setSuccessMsg('');
      createMutation.reset();
      updateMutation.reset();

      if (tenant) {
        setForm({
          name: tenant.name || '',
          tradingName: tenant.tradingName || '',
          registrationNumber: tenant.registrationNumber || '',
          vatNumber: tenant.vatNumber || '',
          contactEmail: tenant.contactEmail || '',
          contactPhone: tenant.contactPhone || '',
          status: tenant.status || 'active',
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [isOpen, tenant]);

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
      tradingName: form.tradingName.trim(),
      registrationNumber: form.registrationNumber.trim(),
      vatNumber: form.vatNumber.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      status: form.status,
    };

    const onSuccess = () => {
      setSuccessMsg(isEditing ? 'Tenant updated successfully' : 'Tenant created successfully');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    };

    const onError = (err) => {
      setErrors({ _form: err.message || 'Failed to save tenant' });
    };

    if (isEditing) {
      updateMutation.mutate({ id: tenant.id, data: payload }, { onSuccess, onError });
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
            {isEditing ? 'Edit Tenant' : 'Add Tenant'}
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

          {/* Trading Name */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Trading Name
            </label>
            <input
              type="text"
              value={form.tradingName}
              onChange={(e) => handleChange('tradingName', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
            />
          </div>

          {/* Registration + VAT row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                Registration No.
              </label>
              <input
                type="text"
                value={form.registrationNumber}
                onChange={(e) => handleChange('registrationNumber', e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                VAT Number
              </label>
              <input
                type="text"
                value={form.vatNumber}
                onChange={(e) => handleChange('vatNumber', e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
              />
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
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Tenant'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantModal;
