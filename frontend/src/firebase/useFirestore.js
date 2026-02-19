import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  // Properties
  getAllProperties, getPropertyById, createProperty, updateProperty, deleteProperty,
  // Tenants
  getAllTenants, getTenantById, createTenant, updateTenant, deleteTenant,
  // Leases
  getAllLeases, getLeaseById, createLease, updateLease, deleteLease,
  // Utility Providers
  getAllUtilityProviders, getUtilityProviderById, createUtilityProvider, updateUtilityProvider, deleteUtilityProvider,
  // Utility Accounts
  getAllUtilityAccounts, getUtilityAccountById, createUtilityAccount, updateUtilityAccount, deleteUtilityAccount,
  // Meters
  getAllMeters, getMeterById, createMeter, updateMeter, deleteMeter,
  // Bills
  getAllBills, getBillById, createBill, updateBill, deleteBill,
  // Allocations
  getAllAllocations, getAllocationById, createAllocation, updateAllocation, deleteAllocation,
  // Exceptions
  getAllExceptions, getExceptionById, createException, updateException, deleteException,
  // Invoices
  getAllInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice,
  // Utilities tree
  getUtilitiesTree,
  // Query functions
  getPropertiesByPortfolio, getTenantsByProperty,
  getBillsByProperty, getBillsByUtilityAccount, getBillsByStatus,
  getUtilityAccountsByProperty, getUtilityAccountsByTenant,
  getAllocationsByBill, getAllocationsByTenant, getAllocationsByProperty, getOpenExceptions, getExceptionsByBill,
} from './firestoreService';

// ---------------------------------------------------------------------------
// Helper: build mutation hooks with automatic cache invalidation
// ---------------------------------------------------------------------------

function makeCrudHooks(key, createFn, updateFn, deleteFn) {
  const useCreate = () => {
    const qc = useQueryClient();
    return useMutation({ mutationFn: createFn, onSuccess: () => qc.invalidateQueries({ queryKey: [key] }) });
  };

  const useUpdate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }) => updateFn(id, data),
      onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
    });
  };

  const useDelete = () => {
    const qc = useQueryClient();
    return useMutation({ mutationFn: deleteFn, onSuccess: () => qc.invalidateQueries({ queryKey: [key] }) });
  };

  return { useCreate, useUpdate, useDelete };
}

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

export const useProperties = () =>
  useQuery({ queryKey: ['properties'], queryFn: getAllProperties });

export const useProperty = (id) =>
  useQuery({ queryKey: ['properties', id], queryFn: () => getPropertyById(id), enabled: !!id });

export const usePropertiesByPortfolio = (portfolioId) =>
  useQuery({
    queryKey: ['properties', 'portfolio', portfolioId],
    queryFn: () => getPropertiesByPortfolio(portfolioId),
    enabled: !!portfolioId,
  });

const propertyMutations = makeCrudHooks('properties', createProperty, updateProperty, deleteProperty);
export const useCreateProperty = propertyMutations.useCreate;
export const useUpdateProperty = propertyMutations.useUpdate;
export const useDeleteProperty = propertyMutations.useDelete;

// ---------------------------------------------------------------------------
// Tenants
// ---------------------------------------------------------------------------

export const useTenants = () =>
  useQuery({ queryKey: ['tenants'], queryFn: getAllTenants });

export const useTenant = (id) =>
  useQuery({ queryKey: ['tenants', id], queryFn: () => getTenantById(id), enabled: !!id });

export const useTenantsByProperty = (propertyId) =>
  useQuery({
    queryKey: ['tenants', 'property', propertyId],
    queryFn: () => getTenantsByProperty(propertyId),
    enabled: !!propertyId,
  });

const tenantMutations = makeCrudHooks('tenants', createTenant, updateTenant, deleteTenant);
export const useCreateTenant = tenantMutations.useCreate;
export const useUpdateTenant = tenantMutations.useUpdate;
export const useDeleteTenant = tenantMutations.useDelete;

// ---------------------------------------------------------------------------
// Leases
// ---------------------------------------------------------------------------

export const useLeases = () =>
  useQuery({ queryKey: ['leases'], queryFn: getAllLeases });

export const useLease = (id) =>
  useQuery({ queryKey: ['leases', id], queryFn: () => getLeaseById(id), enabled: !!id });

const leaseMutations = makeCrudHooks('leases', createLease, updateLease, deleteLease);
export const useCreateLease = leaseMutations.useCreate;
export const useUpdateLease = leaseMutations.useUpdate;
export const useDeleteLease = leaseMutations.useDelete;

// ---------------------------------------------------------------------------
// Utility Providers
// ---------------------------------------------------------------------------

export const useUtilityProviders = () =>
  useQuery({ queryKey: ['utilityProviders'], queryFn: getAllUtilityProviders });

export const useUtilityProvider = (id) =>
  useQuery({ queryKey: ['utilityProviders', id], queryFn: () => getUtilityProviderById(id), enabled: !!id });

const utilityProviderMutations = makeCrudHooks('utilityProviders', createUtilityProvider, updateUtilityProvider, deleteUtilityProvider);
export const useCreateUtilityProvider = utilityProviderMutations.useCreate;
export const useUpdateUtilityProvider = utilityProviderMutations.useUpdate;
export const useDeleteUtilityProvider = utilityProviderMutations.useDelete;

// ---------------------------------------------------------------------------
// Utility Accounts
// ---------------------------------------------------------------------------

export const useUtilityAccounts = () =>
  useQuery({ queryKey: ['utilityAccounts'], queryFn: getAllUtilityAccounts });

export const useUtilityAccount = (id) =>
  useQuery({ queryKey: ['utilityAccounts', id], queryFn: () => getUtilityAccountById(id), enabled: !!id });

export const useUtilityAccountsByProperty = (propertyId) =>
  useQuery({
    queryKey: ['utilityAccounts', 'property', propertyId],
    queryFn: () => getUtilityAccountsByProperty(propertyId),
    enabled: !!propertyId,
  });

export const useUtilityAccountsByTenant = (tenantId) =>
  useQuery({
    queryKey: ['utilityAccounts', 'tenant', tenantId],
    queryFn: () => getUtilityAccountsByTenant(tenantId),
    enabled: !!tenantId,
  });

const utilityAccountMutations = makeCrudHooks('utilityAccounts', createUtilityAccount, updateUtilityAccount, deleteUtilityAccount);
export const useCreateUtilityAccount = utilityAccountMutations.useCreate;
export const useUpdateUtilityAccount = utilityAccountMutations.useUpdate;
export const useDeleteUtilityAccount = utilityAccountMutations.useDelete;

// ---------------------------------------------------------------------------
// Meters
// ---------------------------------------------------------------------------

export const useMeters = () =>
  useQuery({ queryKey: ['meters'], queryFn: getAllMeters });

export const useMeter = (id) =>
  useQuery({ queryKey: ['meters', id], queryFn: () => getMeterById(id), enabled: !!id });

const meterMutations = makeCrudHooks('meters', createMeter, updateMeter, deleteMeter);
export const useCreateMeter = meterMutations.useCreate;
export const useUpdateMeter = meterMutations.useUpdate;
export const useDeleteMeter = meterMutations.useDelete;

// ---------------------------------------------------------------------------
// Bills
// ---------------------------------------------------------------------------

export const useBills = () =>
  useQuery({ queryKey: ['bills'], queryFn: getAllBills });

export const useBill = (id) =>
  useQuery({ queryKey: ['bills', id], queryFn: () => getBillById(id), enabled: !!id });

export const useBillsByProperty = (propertyId) =>
  useQuery({
    queryKey: ['bills', 'property', propertyId],
    queryFn: () => getBillsByProperty(propertyId),
    enabled: !!propertyId,
  });

export const useBillsByUtilityAccount = (utilityAccountId) =>
  useQuery({
    queryKey: ['bills', 'utilityAccount', utilityAccountId],
    queryFn: () => getBillsByUtilityAccount(utilityAccountId),
    enabled: !!utilityAccountId,
  });

export const useBillsByStatus = (status) =>
  useQuery({
    queryKey: ['bills', 'status', status],
    queryFn: () => getBillsByStatus(status),
    enabled: !!status,
  });

const billMutations = makeCrudHooks('bills', createBill, updateBill, deleteBill);
export const useCreateBill = billMutations.useCreate;
export const useUpdateBill = billMutations.useUpdate;
export const useDeleteBill = billMutations.useDelete;

// ---------------------------------------------------------------------------
// Allocations
// ---------------------------------------------------------------------------

export const useAllocations = () =>
  useQuery({ queryKey: ['allocations'], queryFn: getAllAllocations });

export const useAllocation = (id) =>
  useQuery({ queryKey: ['allocations', id], queryFn: () => getAllocationById(id), enabled: !!id });

export const useAllocationsByBill = (billId) =>
  useQuery({
    queryKey: ['allocations', 'bill', billId],
    queryFn: () => getAllocationsByBill(billId),
    enabled: !!billId,
  });

export const useAllocationsByTenant = (tenantId) =>
  useQuery({
    queryKey: ['allocations', 'tenant', tenantId],
    queryFn: () => getAllocationsByTenant(tenantId),
    enabled: !!tenantId,
  });

export const useAllocationsByProperty = (propertyId) =>
  useQuery({
    queryKey: ['allocations', 'property', propertyId],
    queryFn: () => getAllocationsByProperty(propertyId),
    enabled: !!propertyId,
  });

const allocationMutations = makeCrudHooks('allocations', createAllocation, updateAllocation, deleteAllocation);
export const useCreateAllocation = allocationMutations.useCreate;
export const useUpdateAllocation = allocationMutations.useUpdate;
export const useDeleteAllocation = allocationMutations.useDelete;

// ---------------------------------------------------------------------------
// Exceptions
// ---------------------------------------------------------------------------

export const useExceptions = () =>
  useQuery({ queryKey: ['exceptions'], queryFn: getAllExceptions });

export const useException = (id) =>
  useQuery({ queryKey: ['exceptions', id], queryFn: () => getExceptionById(id), enabled: !!id });

export const useOpenExceptions = () =>
  useQuery({ queryKey: ['exceptions', 'open'], queryFn: getOpenExceptions });

export const useExceptionsByBill = (billId) =>
  useQuery({
    queryKey: ['exceptions', 'bill', billId],
    queryFn: () => getExceptionsByBill(billId),
    enabled: !!billId,
  });

const exceptionMutations = makeCrudHooks('exceptions', createException, updateException, deleteException);
export const useCreateException = exceptionMutations.useCreate;
export const useUpdateException = exceptionMutations.useUpdate;
export const useDeleteException = exceptionMutations.useDelete;

// ---------------------------------------------------------------------------
// Invoices
// ---------------------------------------------------------------------------

export const useInvoices = () =>
  useQuery({ queryKey: ['invoices'], queryFn: getAllInvoices });

export const useInvoice = (id) =>
  useQuery({ queryKey: ['invoices', id], queryFn: () => getInvoiceById(id), enabled: !!id });

const invoiceMutations = makeCrudHooks('invoices', createInvoice, updateInvoice, deleteInvoice);
export const useCreateInvoice = invoiceMutations.useCreate;
export const useUpdateInvoice = invoiceMutations.useUpdate;
export const useDeleteInvoice = invoiceMutations.useDelete;

// ---------------------------------------------------------------------------
// Utilities Tree (read-only reference data)
// ---------------------------------------------------------------------------

export const useUtilitiesTree = () =>
  useQuery({
    queryKey: ['utilitiesTree'],
    queryFn: getUtilitiesTree,
    staleTime: 10 * 60 * 1000,
  });
