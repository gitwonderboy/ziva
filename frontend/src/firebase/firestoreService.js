import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// ---------------------------------------------------------------------------
// Generic CRUD helpers
// ---------------------------------------------------------------------------

async function createDocument(collectionName, data) {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id, ...data };
}

async function getAllDocuments(collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function getDocumentById(collectionName, id) {
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

async function updateDocument(collectionName, id, data) {
  const ref = doc(db, collectionName, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  return { id, ...data };
}

async function deleteDocument(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
  return id;
}

// ---------------------------------------------------------------------------
// Collection-specific CRUD exports
// ---------------------------------------------------------------------------

// Properties
export const createProperty = (data) => createDocument('properties', data);
export const getAllProperties = () => getAllDocuments('properties');
export const getPropertyById = (id) => getDocumentById('properties', id);
export const updateProperty = (id, data) => updateDocument('properties', id, data);
export const deleteProperty = (id) => deleteDocument('properties', id);

// Tenants
export const createTenant = (data) => createDocument('tenants', data);
export const getAllTenants = () => getAllDocuments('tenants');
export const getTenantById = (id) => getDocumentById('tenants', id);
export const updateTenant = (id, data) => updateDocument('tenants', id, data);
export const deleteTenant = (id) => deleteDocument('tenants', id);

// Leases
export const createLease = (data) => createDocument('leases', data);
export const getAllLeases = () => getAllDocuments('leases');
export const getLeaseById = (id) => getDocumentById('leases', id);
export const updateLease = (id, data) => updateDocument('leases', id, data);
export const deleteLease = (id) => deleteDocument('leases', id);

// Utility Providers
export const createUtilityProvider = (data) => createDocument('utilityProviders', data);
export const getAllUtilityProviders = () => getAllDocuments('utilityProviders');
export const getUtilityProviderById = (id) => getDocumentById('utilityProviders', id);
export const updateUtilityProvider = (id, data) => updateDocument('utilityProviders', id, data);
export const deleteUtilityProvider = (id) => deleteDocument('utilityProviders', id);

// Utility Accounts
export const createUtilityAccount = (data) => createDocument('utilityAccounts', data);
export const getAllUtilityAccounts = () => getAllDocuments('utilityAccounts');
export const getUtilityAccountById = (id) => getDocumentById('utilityAccounts', id);
export const updateUtilityAccount = (id, data) => updateDocument('utilityAccounts', id, data);
export const deleteUtilityAccount = (id) => deleteDocument('utilityAccounts', id);

// Meters
export const createMeter = (data) => createDocument('meters', data);
export const getAllMeters = () => getAllDocuments('meters');
export const getMeterById = (id) => getDocumentById('meters', id);
export const updateMeter = (id, data) => updateDocument('meters', id, data);
export const deleteMeter = (id) => deleteDocument('meters', id);

// Bills
export const createBill = (data) => createDocument('bills', data);
export const getAllBills = () => getAllDocuments('bills');
export const getBillById = (id) => getDocumentById('bills', id);
export const updateBill = (id, data) => updateDocument('bills', id, data);
export const deleteBill = (id) => deleteDocument('bills', id);

// Allocations
export const createAllocation = (data) => createDocument('allocations', data);
export const getAllAllocations = () => getAllDocuments('allocations');
export const getAllocationById = (id) => getDocumentById('allocations', id);
export const updateAllocation = (id, data) => updateDocument('allocations', id, data);
export const deleteAllocation = (id) => deleteDocument('allocations', id);

// Exceptions
export const createException = (data) => createDocument('exceptions', data);
export const getAllExceptions = () => getAllDocuments('exceptions');
export const getExceptionById = (id) => getDocumentById('exceptions', id);
export const updateException = (id, data) => updateDocument('exceptions', id, data);
export const deleteException = (id) => deleteDocument('exceptions', id);

// Invoices
export const createInvoice = (data) => createDocument('invoices', data);
export const getAllInvoices = () => getAllDocuments('invoices');
export const getInvoiceById = (id) => getDocumentById('invoices', id);
export const updateInvoice = (id, data) => updateDocument('invoices', id, data);
export const deleteInvoice = (id) => deleteDocument('invoices', id);

// ---------------------------------------------------------------------------
// Utilities tree (three-level subcollection hierarchy)
// ---------------------------------------------------------------------------

export async function getUtilitiesTree() {
  const categoriesSnap = await getDocs(collection(db, 'utilities'));
  const categories = await Promise.all(
    categoriesSnap.docs.map(async (catDoc) => {
      const cat = { id: catDoc.id, ...catDoc.data() };
      const subcatsSnap = await getDocs(
        collection(db, 'utilities', catDoc.id, 'subcategories'),
      );
      cat.subcategories = await Promise.all(
        subcatsSnap.docs.map(async (subDoc) => {
          const sub = { id: subDoc.id, ...subDoc.data() };
          const providersSnap = await getDocs(
            collection(db, 'utilities', catDoc.id, 'subcategories', subDoc.id, 'providers'),
          );
          sub.providers = providersSnap.docs.map((p) => ({ id: p.id, ...p.data() }));
          return sub;
        }),
      );
      return cat;
    }),
  );
  return categories;
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

export async function getPropertiesByPortfolio(portfolioId) {
  const q = query(collection(db, 'properties'), where('portfolioId', '==', portfolioId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getTenantsByProperty(propertyId) {
  const q = query(collection(db, 'tenants'), where('propertyId', '==', propertyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getBillsByProperty(propertyId) {
  const q = query(collection(db, 'bills'), where('propertyId', '==', propertyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getBillsByUtilityAccount(utilityAccountId) {
  const q = query(collection(db, 'bills'), where('utilityAccountId', '==', utilityAccountId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getBillsByStatus(status) {
  const q = query(collection(db, 'bills'), where('status', '==', status));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllocationsByBill(billId) {
  const q = query(collection(db, 'allocations'), where('billId', '==', billId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllocationsByTenant(tenantId) {
  const q = query(collection(db, 'allocations'), where('tenantId', '==', tenantId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAllocationsByProperty(propertyId) {
  const q = query(collection(db, 'allocations'), where('propertyId', '==', propertyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUtilityAccountsByProperty(propertyId) {
  const q = query(collection(db, 'utilityAccounts'), where('propertyId', '==', propertyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getUtilityAccountsByTenant(tenantId) {
  const q = query(collection(db, 'utilityAccounts'), where('tenantId', '==', tenantId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getOpenExceptions() {
  const q = query(collection(db, 'exceptions'), where('status', '==', 'open'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getExceptionsByBill(billId) {
  const q = query(collection(db, 'exceptions'), where('billId', '==', billId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
