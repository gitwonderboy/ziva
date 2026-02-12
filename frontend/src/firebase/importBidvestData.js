import * as XLSX from 'xlsx';
import { collection, addDoc, getDocs, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { db } from './config';

// ---------------------------------------------------------------------------
// Column header mapping — maps spreadsheet headers to internal keys
// ---------------------------------------------------------------------------

const COLUMN_MAP = {
  'BP Number': 'bpNumber',
  'SAP Account Number': 'sapAccountNumber',
  'TENANT': 'tenant',
  'Vendor Name / Municipality': 'vendorRaw',
  'Vendor / Minicipal Account Number': 'accountNumber',
  'Company': 'company',
  // Utility type flags
  'Rates': 'rates',
  'Electricity': 'electricity',
  'Water & Sanitation': 'water_sanitation',
  'Refuse/Waste': 'refuse_waste',
  'Effluent': 'effluent',
  'DSW': 'dsw',
  'Levies': 'levies',
  'Csos Levies': 'csos_levies',
  'Improvement District': 'improvement_district',
};

// Utility flag keys in the order they appear in the spreadsheet
const UTILITY_KEYS = [
  { col: 'rates', label: 'Rates' },
  { col: 'electricity', label: 'Electricity' },
  { col: 'water_sanitation', label: 'Water & Sanitation' },
  { col: 'refuse_waste', label: 'Refuse & Waste' },
  { col: 'effluent', label: 'Effluent' },
  { col: 'dsw', label: 'DSW' },
  { col: 'levies', label: 'Levies' },
  { col: 'csos_levies', label: 'CSOS Levies' },
  { col: 'improvement_district', label: 'Improvement District' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeRow(raw) {
  const row = {};
  for (const [header, key] of Object.entries(COLUMN_MAP)) {
    const val = raw[header];
    row[key] = typeof val === 'string' ? val.trim() : (val ?? '');
  }
  return row;
}

function parseProviderName(vendorRaw) {
  if (!vendorRaw) return null;
  // Format: "CITY OF JOBURG - 403437971 (766698)"  →  "City Of Joburg"
  const name = vendorRaw.split(' - ')[0].trim();
  if (!name) return null;
  // Title-case it
  return name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseAccountFromVendor(vendorRaw) {
  if (!vendorRaw) return null;
  const afterDash = vendorRaw.split(' - ')[1];
  if (!afterDash) return null;
  return afterDash.replace(/[()]/g, '').trim();
}

const ESKOM_PATTERN = /eskom/i;
const BODY_CORPORATE_PATTERN = /body\s*corp|sectional|strata|hoa|home\s*owners/i;

function inferProviderType(name) {
  if (!name) return 'municipality';
  if (ESKOM_PATTERN.test(name)) return 'eskom';
  if (BODY_CORPORATE_PATTERN.test(name)) return 'private';
  return 'municipality';
}

function getActiveUtilities(row) {
  return UTILITY_KEYS
    .filter(({ col }) => String(row[col]).toUpperCase() === 'YES')
    .map(({ col }) => col);
}

let _onProgress = null;

function log(msg) {
  console.log(`[BidvestImport] ${msg}`);
  if (_onProgress) _onProgress(msg);
}

// ---------------------------------------------------------------------------
// Firestore batch helper — batches are limited to 500 operations
// ---------------------------------------------------------------------------

async function commitInBatches(operations) {
  const BATCH_LIMIT = 450; // stay under the 500 limit
  for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    const slice = operations.slice(i, i + BATCH_LIMIT);
    for (const op of slice) {
      op(batch);
    }
    await batch.commit();
    log(`  Committed batch ${Math.floor(i / BATCH_LIMIT) + 1} (${slice.length} ops)`);
  }
}

// ---------------------------------------------------------------------------
// Main import function
// ---------------------------------------------------------------------------

export async function importBidvestData(file, { onProgress } = {}) {
  _onProgress = onProgress || null;
  log('Starting Bidvest data import...');

  // ── 1. Parse Excel ──
  let rows;
  if (file instanceof File) {
    // Browser File object
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  } else if (typeof file === 'string') {
    // File path (Node.js usage)
    const workbook = XLSX.readFile(file);
    const sheetName = workbook.SheetNames[0];
    rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  } else {
    throw new Error('file must be a File object or a file path string');
  }

  log(`Parsed ${rows.length} rows from spreadsheet`);

  if (rows.length === 0) {
    log('No data to import.');
    return { providers: 0, properties: 0, tenants: 0, utilityAccounts: 0 };
  }

  // Log detected headers so the user can verify mapping
  const headers = Object.keys(rows[0]);
  log(`Detected columns: ${headers.join(', ')}`);

  const normalized = rows.map(normalizeRow);

  // ── 2. Extract unique entities ──

  // Providers: unique names from vendorRaw
  const providerMap = new Map(); // name → { name, type, vendorRaw }
  for (const row of normalized) {
    const name = parseProviderName(row.vendorRaw);
    if (name && !providerMap.has(name)) {
      providerMap.set(name, {
        name,
        type: inferProviderType(name),
        vendorRaw: row.vendorRaw,
      });
    }
  }
  log(`Found ${providerMap.size} unique providers`);

  // Properties: unique BP numbers
  const propertyMap = new Map(); // bpNumber → row (first occurrence)
  for (const row of normalized) {
    const bp = row.bpNumber;
    if (bp && !propertyMap.has(bp)) {
      propertyMap.set(bp, row);
    }
  }
  log(`Found ${propertyMap.size} unique properties`);

  // Tenants: unique tenant names, skip VACANT and empty
  const tenantSet = new Set();
  for (const row of normalized) {
    const t = row.tenant;
    if (t && t.toUpperCase() !== 'VACANT') {
      tenantSet.add(t);
    }
  }
  log(`Found ${tenantSet.size} unique tenants (excluding VACANT)`);

  // ── 3. Write to Firestore ──

  // 3a. Providers
  log('Importing utility providers...');
  const providerIdMap = new Map(); // name → Firestore doc ID
  const providerOps = [];
  for (const [name, data] of providerMap) {
    const ref = doc(collection(db, 'utilityProviders'));
    providerIdMap.set(name, ref.id);
    providerOps.push((batch) => {
      batch.set(ref, {
        name: data.name,
        type: data.type,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }
  await commitInBatches(providerOps);
  log(`  ✓ ${providerMap.size} providers imported`);

  // 3b. Properties
  log('Importing properties...');
  const propertyIdMap = new Map(); // bpNumber → Firestore doc ID
  const propertyOps = [];
  for (const [bp, row] of propertyMap) {
    const ref = doc(collection(db, 'properties'));
    propertyIdMap.set(bp, ref.id);
    propertyOps.push((batch) => {
      batch.set(ref, {
        bpNumber: bp,
        name: bp,
        company: 'Bidvest Properties',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }
  await commitInBatches(propertyOps);
  log(`  ✓ ${propertyMap.size} properties imported`);

  // 3c. Tenants
  log('Importing tenants...');
  const tenantIdMap = new Map(); // name → Firestore doc ID
  const tenantOps = [];
  for (const name of tenantSet) {
    const ref = doc(collection(db, 'tenants'));
    tenantIdMap.set(name, ref.id);
    tenantOps.push((batch) => {
      batch.set(ref, {
        name,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }
  await commitInBatches(tenantOps);
  log(`  ✓ ${tenantSet.size} tenants imported`);

  // 3d. Utility Accounts — one per spreadsheet row
  log('Importing utility accounts...');
  const accountOps = [];
  let skipped = 0;
  for (const row of normalized) {
    const providerName = parseProviderName(row.vendorRaw);
    const propertyId = propertyIdMap.get(row.bpNumber);
    const providerId = providerName ? providerIdMap.get(providerName) : null;
    const tenantId = (row.tenant && row.tenant.toUpperCase() !== 'VACANT')
      ? tenantIdMap.get(row.tenant)
      : null;

    if (!propertyId) {
      skipped++;
      continue;
    }

    const utilityTypes = getActiveUtilities(row);
    const ref = doc(collection(db, 'utilityAccounts'));

    accountOps.push((batch) => {
      batch.set(ref, {
        propertyId,
        tenantId: tenantId || null,
        tenantName: row.tenant || 'VACANT',
        providerId: providerId || null,
        providerName: providerName || 'Unknown',
        accountNumber: String(row.accountNumber),
        sapAccountNumber: String(row.sapAccountNumber),
        bpNumber: row.bpNumber,
        company: row.company || 'Bidvest Properties',
        utilityTypes,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }
  await commitInBatches(accountOps);
  log(`  ✓ ${accountOps.length} utility accounts imported (${skipped} rows skipped — no BP number)`);

  // ── 4. Summary ──
  const summary = {
    providers: providerMap.size,
    properties: propertyMap.size,
    tenants: tenantSet.size,
    utilityAccounts: accountOps.length,
  };

  log('Import complete!');
  log(`  Providers:        ${summary.providers}`);
  log(`  Properties:       ${summary.properties}`);
  log(`  Tenants:          ${summary.tenants}`);
  log(`  Utility Accounts: ${summary.utilityAccounts}`);

  return summary;
}
