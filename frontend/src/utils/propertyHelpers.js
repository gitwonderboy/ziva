export const CHARGE_FIELDS = [
  { key: 'rates', label: 'Rates' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'water_sanitation', label: 'Water & Sanitation' },
  { key: 'refuse_waste', label: 'Refuse & Waste' },
  { key: 'effluent', label: 'Effluent' },
  { key: 'siding_maintenance', label: 'Siding Maintenance' },
  { key: 'sundry', label: 'Sundry' },
  { key: 'dsw', label: 'DSW' },
  { key: 'levies', label: 'Levies' },
  { key: 'csos_levies', label: 'CSOS Levies' },
  { key: 'improvement_district', label: 'Improvement District' },
  { key: 'incentive_payment', label: 'Incentive Payment' },
  { key: 'interest_on_arrears', label: 'Interest on Arrears' },
  { key: 'monthly_rental', label: 'Monthly Rental' },
  { key: 'security', label: 'Security' },
  { key: 'deposit', label: 'Deposit' },
  { key: 'meter_reading', label: 'Meter Reading' },
  { key: 'general', label: 'General' },
];

export function parseProviderName(municipalityRaw) {
  if (!municipalityRaw || municipalityRaw === 'N/A') return 'Unknown';
  return municipalityRaw.replace(/\s*-\s*\d.*$/, '').trim();
}

const ESKOM_PATTERN = /eskom/i;
const MUNICIPALITY_KEYWORDS = /city of|municipality|metro|district|local|tshwane|joburg|cape town|mangaung|ekurhuleni|ethekwini|msunduzi|mbombela|polokwane|emfuleni|mogale|rustenburg|madibeng|drakenstein|stellenbosch|buffalo|nelson mandela|sol plaatje/i;

export function inferProviderType(name) {
  if (!name || name === 'Unknown') return 'Unknown';
  if (ESKOM_PATTERN.test(name)) return 'National Utility';
  if (MUNICIPALITY_KEYWORDS.test(name)) return 'Municipality';
  return 'Private';
}

const REGION_MAP = [
  { pattern: /joburg|ekurhuleni|tshwane|mogale|madibeng|rustenburg|emfuleni|sedibeng|midvaal|lesedi|merafong|rand west/i, region: 'Gauteng' },
  { pattern: /cape town|drakenstein|stellenbosch|saldanha|overstrand|george|knysna|mossel bay|beaufort/i, region: 'Western Cape' },
  { pattern: /ethekwini|msunduzi|newcastle|umhlathuze|kwadukuza/i, region: 'KwaZulu-Natal' },
  { pattern: /mangaung|matjhabeng|dihlabeng/i, region: 'Free State' },
  { pattern: /mbombela|emalahleni|steve tshwete|govan mbeki/i, region: 'Mpumalanga' },
  { pattern: /polokwane|makhado|thulamela|lephalale/i, region: 'Limpopo' },
  { pattern: /buffalo|nelson mandela|amathole|kouga/i, region: 'Eastern Cape' },
  { pattern: /sol plaatje|gamagara|tsantsabane/i, region: 'Northern Cape' },
  { pattern: /mahikeng|tlokwe|matlosana/i, region: 'North West' },
];

export function inferRegion(name) {
  if (!name) return 'Unknown';
  for (const { pattern, region } of REGION_MAP) {
    if (pattern.test(name)) return region;
  }
  return 'Unknown';
}

export function getActiveCharges(record) {
  return CHARGE_FIELDS.filter(
    ({ key }) => record[key] && record[key].toUpperCase() === 'YES'
  ).map(({ label }) => label);
}

export function groupByProperty(records) {
  const map = {};
  for (const rec of records) {
    const bp = rec.bp_number || 'NO_BP';
    if (!map[bp]) {
      map[bp] = {
        bp_number: rec.bp_number,
        tenant_name: rec.tenant_name,
        is_vacant: (rec.tenant_name || '').toUpperCase() === 'VACANT',
        company: rec.company,
        accounts: [],
      };
    }
    map[bp].accounts.push(rec);
  }
  return Object.values(map);
}

export function groupByProvider(records) {
  const map = {};
  for (const rec of records) {
    const name = parseProviderName(rec.municipality_raw);
    if (!map[name]) {
      map[name] = {
        name,
        type: inferProviderType(name),
        region: inferRegion(name),
        accounts: [],
        chargeTypes: new Set(),
      };
    }
    map[name].accounts.push(rec);
    for (const charge of getActiveCharges(rec)) {
      map[name].chargeTypes.add(charge);
    }
  }
  return Object.values(map).map((p) => ({
    ...p,
    chargeTypes: [...p.chargeTypes],
  }));
}

export function groupByTenant(records) {
  const map = {};
  for (const rec of records) {
    const tenant = rec.tenant_name || 'Unknown';
    const key = `${tenant}__${rec.sap_acc_no || ''}`;
    if (!map[key]) {
      map[key] = {
        tenant_name: tenant,
        sap_acc_no: rec.sap_acc_no,
        is_vacant: tenant.toUpperCase() === 'VACANT',
        properties: [],
      };
    }
    map[key].properties.push(rec);
  }
  return Object.values(map);
}
