import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { useCreateProperty, useUpdateProperty, useTenants } from '../firebase';

const PROPERTY_TYPES = [
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'mixed-use', label: 'Mixed-Use' },
];

const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
];

const EMPTY_FORM = {
  bpNumber: '',
  tenantNames: [],
  company: '',
  description: '',
  streetAddress: '',
  suburb: '',
  city: '',
  province: '',
  postalCode: '',
  gla: '',
  propertyType: 'office',
};

const REQUIRED_FIELDS = [
  { key: 'bpNumber', label: 'Property ID' },
];

const PropertyModal = ({ isOpen, onClose, property }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const [, setSearchParams] = useSearchParams();
  const createMutation = useCreateProperty();
  const updateMutation = useUpdateProperty();
  const { data: tenants } = useTenants();

  const tenantList = tenants || [];
  const isEditing = !!property;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setSuccessMsg('');
      createMutation.reset();
      updateMutation.reset();

      if (property) {
        const names = property.tenantNames || (property.name ? [property.name] : []);
        setForm({
          bpNumber: property.bpNumber || '',
          tenantNames: names,
          company: property.company || '',
          description: property.description || '',
          streetAddress: property.streetAddress || '',
          suburb: property.suburb || '',
          city: property.city || '',
          province: property.province || '',
          postalCode: property.postalCode || '',
          gla: property.gla != null ? String(property.gla) : '',
          propertyType: property.propertyType || 'office',
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
    if (form.tenantNames.length === 0) {
      newErrors.tenantNames = 'At least one tenant is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      bpNumber: form.bpNumber.trim(),
      name: form.tenantNames.join(', '),
      tenantNames: form.tenantNames,
      company: form.company.trim(),
      description: form.description.trim(),
      streetAddress: form.streetAddress.trim(),
      suburb: form.suburb.trim(),
      city: form.city.trim(),
      province: form.province,
      postalCode: form.postalCode.trim(),
      gla: form.gla ? Number(form.gla) : null,
      propertyType: form.propertyType,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white max-h-[90vh] shadow-2xl flex flex-col rounded-2xl mx-4 animate-fade-in-scale">
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

          {/* Property ID */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Property ID <span className="text-error">*</span>
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

          {/* Tenant Names */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Tenants <span className="text-error">*</span>
            </label>
            {form.tenantNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tenantNames.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent-light text-accent text-xs font-bold"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.tenantNames.filter((n) => n !== name);
                        handleChange('tenantNames', updated);
                      }}
                      className="hover:text-error transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <select
              value=""
              onChange={(e) => {
                if (e.target.value === '__add_new__') {
                  onClose();
                  setSearchParams({ tab: 'tenants', openModal: 'true' }, { replace: true });
                } else if (e.target.value && !form.tenantNames.includes(e.target.value)) {
                  handleChange('tenantNames', [...form.tenantNames, e.target.value]);
                }
              }}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text-secondary focus:border-accent ${
                errors.tenantNames ? 'border-error' : 'border-border'
              }`}
            >
              <option value="">Add a tenant...</option>
              {tenantList
                .filter((t) => !form.tenantNames.includes(t.name))
                .map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              <option value="__add_new__">+ Add new tenant</option>
            </select>
            {errors.tenantNames && (
              <p className="text-[11px] font-bold text-error mt-1">{errors.tenantNames}</p>
            )}
          </div>

          {/* Property Owner */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Property Owner
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => handleChange('company', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
            />
          </div>

          {/* Property Description */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Property Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              placeholder="Additional details about this property..."
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent resize-none"
            />
          </div>

          {/* Physical Address */}
          <div className="space-y-3">
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest">
              Physical Address
            </label>
            <input
              type="text"
              value={form.streetAddress}
              onChange={(e) => handleChange('streetAddress', e.target.value)}
              placeholder="Street Address"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
            />
            <input
              type="text"
              value={form.suburb}
              onChange={(e) => handleChange('suburb', e.target.value)}
              placeholder="Suburb"
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="City"
                className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
              />
              <select
                value={form.province}
                onChange={(e) => handleChange('province', e.target.value)}
                className={`w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white focus:border-accent ${
                  form.province ? 'text-text' : 'text-text-secondary'
                }`}
              >
                <option value="">Province</option>
                {SA_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={form.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              placeholder="Postal Code"
              className="w-44 border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
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
