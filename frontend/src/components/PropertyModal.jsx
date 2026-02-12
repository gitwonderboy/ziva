import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateProperty, useUpdateProperty } from '../firebase';

const PROPERTY_TYPES = [
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'mixed-use', label: 'Mixed-Use' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const EMPTY_FORM = {
  bpNumber: '',
  name: '',
  physicalAddress: '',
  gla: '',
  propertyType: 'office',
  status: 'active',
};

const REQUIRED_FIELDS = [
  { key: 'bpNumber', label: 'BP Number' },
  { key: 'name', label: 'Name' },
];

const PropertyModal = ({ isOpen, onClose, property }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();

  const isEditing = !!property;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setSuccessMsg('');
      createMutation.reset();
      updateMutation.reset();

      if (property) {
        setForm({
          bpNumber: property.bpNumber || '',
          name: property.name || '',
          physicalAddress: property.physicalAddress || '',
          gla: property.gla != null ? String(property.gla) : '',
          propertyType: property.propertyType || 'office',
          status: property.status || 'active',
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [isOpen, property]);

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
    for (const { key, label } of REQUIRED_FIELDS) {
      if (!form[key].trim()) {
        newErrors[key] = `${label} is required`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      bpNumber: form.bpNumber.trim(),
      name: form.name.trim(),
      physicalAddress: form.physicalAddress.trim(),
      gla: form.gla ? Number(form.gla) : null,
      propertyType: form.propertyType,
      status: form.status,
    };

    const onSuccess = () => {
      setSuccessMsg(isEditing ? 'Property updated successfully' : 'Property created successfully');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    };

    const onError = (err) => {
      setErrors({ _form: err.message || 'Failed to save property' });
    };

    if (isEditing) {
      updateMutation.mutate({ id: property.id, data: payload }, { onSuccess, onError });
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
            {isEditing ? 'Edit Property' : 'Add Property'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-bg-alt rounded-full transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
          {/* Success */}
          {successMsg && (
            <div className="p-3 bg-success-light border border-success/30 rounded-xl text-sm font-bold text-success">
              {successMsg}
            </div>
          )}

          {/* Form-level error */}
          {errors._form && (
            <div className="p-3 bg-error-light border border-error/30 rounded-xl text-sm font-bold text-error">
              {errors._form}
            </div>
          )}

          {/* BP Number */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              BP Number <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.bpNumber}
              onChange={(e) => handleChange('bpNumber', e.target.value)}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent ${
                errors.bpNumber ? 'border-error' : 'border-border'
              }`}
            />
            {errors.bpNumber && (
              <p className="text-[11px] font-bold text-error mt-1">{errors.bpNumber}</p>
            )}
          </div>

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

          {/* Physical Address */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Physical Address
            </label>
            <input
              type="text"
              value={form.physicalAddress}
              onChange={(e) => handleChange('physicalAddress', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
            />
          </div>

          {/* GLA + Property Type row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                GLA (m²)
              </label>
              <input
                type="number"
                value={form.gla}
                onChange={(e) => handleChange('gla', e.target.value)}
                placeholder="0"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                Property Type
              </label>
              <select
                value={form.propertyType}
                onChange={(e) => handleChange('propertyType', e.target.value)}
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
              >
                {PROPERTY_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
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
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Property'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyModal;
