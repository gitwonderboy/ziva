import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Upload, FileText, Trash2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useCreateTenant, useUpdateTenant, useProperties, storage } from '../firebase';

const EMPTY_FORM = {
  name: '',
  tradingName: '',
  registrationNumber: '',
  vatNumber: '',
  contactEmail: '',
  contactPhone: '',
  workEmail: '',
  workPhone: '',
  nextOfKinName: '',
  nextOfKinPhone: '',
  nextOfKinEmail: '',
  nextOfKinRelationship: '',
  propertyId: '',
};

const TenantModal = ({ isOpen, onClose, tenant }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [leaseFile, setLeaseFile] = useState(null);
  const [existingLease, setExistingLease] = useState(null);
  const [removeLease, setRemoveLease] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const createMutation = useCreateTenant();
  const updateMutation = useUpdateTenant();
  const { data: properties } = useProperties();
  const propertyList = properties || [];

  const isEditing = !!tenant;
  const isSaving = createMutation.isPending || updateMutation.isPending || uploading;

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setSuccessMsg('');
      setLeaseFile(null);
      setRemoveLease(false);
      setUploading(false);
      createMutation.reset();
      updateMutation.reset();

      if (tenant) {
        setExistingLease(
          tenant.leaseAgreementUrl
            ? { url: tenant.leaseAgreementUrl, name: tenant.leaseAgreementName || 'Lease Agreement' }
            : null,
        );
        setForm({
          name: tenant.name || '',
          tradingName: tenant.tradingName || '',
          registrationNumber: tenant.registrationNumber || '',
          vatNumber: tenant.vatNumber || '',
          contactEmail: tenant.contactEmail || '',
          contactPhone: tenant.contactPhone || '',
          workEmail: tenant.workEmail || '',
          workPhone: tenant.workPhone || '',
          nextOfKinName: tenant.nextOfKinName || '',
          nextOfKinPhone: tenant.nextOfKinPhone || '',
          nextOfKinEmail: tenant.nextOfKinEmail || '',
          nextOfKinRelationship: tenant.nextOfKinRelationship || '',
          propertyId: tenant.propertyId || '',
        });
      } else {
        setExistingLease(null);
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
      newErrors.name = 'Tenant Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      tradingName: form.tradingName.trim(),
      registrationNumber: form.registrationNumber.trim(),
      vatNumber: form.vatNumber.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      workEmail: form.workEmail.trim(),
      workPhone: form.workPhone.trim(),
      nextOfKinName: form.nextOfKinName.trim(),
      nextOfKinPhone: form.nextOfKinPhone.trim(),
      nextOfKinEmail: form.nextOfKinEmail.trim(),
      nextOfKinRelationship: form.nextOfKinRelationship.trim(),
      propertyId: form.propertyId || null,
    };

    try {
      setUploading(true);

      // Upload new lease file
      if (leaseFile) {
        const timestamp = Date.now();
        const storagePath = `leases/${form.name.trim().replace(/\s+/g, '_')}_${timestamp}_${leaseFile.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, leaseFile);
        const downloadUrl = await getDownloadURL(storageRef);
        payload.leaseAgreementUrl = downloadUrl;
        payload.leaseAgreementName = leaseFile.name;
        payload.leaseAgreementPath = storagePath;
      } else if (removeLease) {
        // Remove existing lease
        if (tenant?.leaseAgreementPath) {
          try {
            await deleteObject(ref(storage, tenant.leaseAgreementPath));
          } catch (_) { /* file may already be gone */ }
        }
        payload.leaseAgreementUrl = null;
        payload.leaseAgreementName = null;
        payload.leaseAgreementPath = null;
      }

      setUploading(false);
    } catch (err) {
      setUploading(false);
      setErrors({ _form: 'Failed to upload lease agreement' });
      return;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white max-h-[90vh] shadow-2xl flex flex-col rounded-2xl mx-4 animate-fade-in-scale">
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

          {/* Tenant Name */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Tenant Name <span className="text-error">*</span>
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

          {/* Work Contact */}
          <div className="pt-2">
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Work Contact
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                  Work Email
                </label>
                <input
                  type="email"
                  value={form.workEmail}
                  onChange={(e) => handleChange('workEmail', e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                  Work Phone
                </label>
                <input
                  type="tel"
                  value={form.workPhone}
                  onChange={(e) => handleChange('workPhone', e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Next of Kin */}
          <div className="pt-2">
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Next of Kin
            </label>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={form.nextOfKinName}
                    onChange={(e) => handleChange('nextOfKinName', e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={form.nextOfKinRelationship}
                    onChange={(e) => handleChange('nextOfKinRelationship', e.target.value)}
                    placeholder="e.g. Spouse, Parent, Sibling"
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={form.nextOfKinPhone}
                    onChange={(e) => handleChange('nextOfKinPhone', e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.nextOfKinEmail}
                    onChange={(e) => handleChange('nextOfKinEmail', e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lease Agreement */}
          <div className="pt-2">
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-3">
              Lease Agreement
            </label>
            {/* Existing file */}
            {existingLease && !removeLease && !leaseFile && (
              <div className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-border">
                <FileText className="w-5 h-5 text-accent shrink-0" />
                <a
                  href={existingLease.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-accent hover:underline truncate flex-1"
                >
                  {existingLease.name}
                </a>
                <button
                  type="button"
                  onClick={() => setRemoveLease(true)}
                  className="p-1.5 hover:bg-error-light rounded-lg transition-colors shrink-0"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5 text-error" />
                </button>
              </div>
            )}
            {/* New file selected */}
            {leaseFile && (
              <div className="flex items-center gap-3 p-3 bg-accent-light/30 rounded-xl border border-accent/30">
                <FileText className="w-5 h-5 text-accent shrink-0" />
                <span className="text-sm font-bold text-text truncate flex-1">{leaseFile.name}</span>
                <button
                  type="button"
                  onClick={() => { setLeaseFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="p-1.5 hover:bg-error-light rounded-lg transition-colors shrink-0"
                  title="Remove"
                >
                  <X className="w-3.5 h-3.5 text-error" />
                </button>
              </div>
            )}
            {/* Upload button */}
            {!leaseFile && (!existingLease || removeLease) && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-xl text-sm font-bold text-text-secondary hover:border-accent hover:text-accent transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Lease Agreement
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setLeaseFile(file);
                  setRemoveLease(false);
                }
              }}
            />
            <p className="text-[10px] text-text-secondary mt-1.5">Accepted: PDF, DOC, DOCX</p>
          </div>

          {/* Assigned Property */}
          <div>
            <label className="block text-[10px] font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Assigned Property
            </label>
            <select
              value={form.propertyId}
              onChange={(e) => handleChange('propertyId', e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 text-sm font-bold outline-none transition-colors bg-white text-text focus:border-accent"
            >
              <option value="">None (Unassigned)</option>
              {propertyList.map((p) => (
                <option key={p.id} value={p.id}>{p.bpNumber || p.name}</option>
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
