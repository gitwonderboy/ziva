const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const utilityData = [
  {
    id: "electricity",
    name: "Electricity",
    icon: "⚡",
    description: "Electricity supply options for South African properties, from municipal distributors and Eskom to sub-metering, solar and backup power.",
    subcategories: [
      {
        id: "municipal_supply",
        name: "Municipal Supply",
        providers: [
          { id: "coj", name: "City of Johannesburg (CoJ)", description: "Supplies electricity to properties within Johannesburg metro boundaries." },
          { id: "cot", name: "City of Tshwane (CoT)", description: "Electricity distributor for the Tshwane metropolitan area including Pretoria." },
          { id: "coct", name: "City of Cape Town (CoCT)", description: "Municipal electricity distribution for Cape Town and surrounding areas." },
          { id: "ethekwini", name: "City of eThekwini", description: "Electricity distributor for the Durban metro and surrounding KwaZulu-Natal areas." },
          { id: "ekurhuleni", name: "Ekurhuleni Metropolitan Municipality", description: "Serves the East Rand region including Germiston, Benoni and Boksburg." },
          { id: "nmb", name: "Nelson Mandela Bay Municipality", description: "Electricity provider for Port Elizabeth and surrounding Eastern Cape areas." },
          { id: "buffalo_city", name: "Buffalo City Municipality", description: "Electricity distributor for East London and surrounding areas." },
          { id: "mangaung", name: "Mangaung Municipality", description: "Electricity provider for Bloemfontein and surrounding Free State areas." },
        ],
      },
      {
        id: "direct_eskom",
        name: "Direct Eskom Supply",
        providers: [
          { id: "eskom_megaflex", name: "Eskom Megaflex", description: "High-voltage tariff for large industrial and commercial users. Time-of-use based." },
          { id: "eskom_miniflex", name: "Eskom Miniflex", description: "Medium commercial/industrial tariff for properties supplied directly by Eskom." },
          { id: "eskom_ruraflex", name: "Eskom Ruraflex", description: "Rural electricity tariff for farms and properties outside municipal boundaries." },
          { id: "eskom_homelight", name: "Eskom Homelight", description: "Residential tariff for direct Eskom-supplied households." },
        ],
      },
      {
        id: "bulk_common_area",
        name: "Bulk / Common Area",
        providers: [
          { id: "landlord_bulk", name: "Landlord Account (Municipal)", description: "Landlord-held municipal account for common area and bulk supply to the property." },
        ],
      },
      {
        id: "sub_metered_tenant",
        name: "Sub-metered Tenant",
        providers: [
          { id: "citiq", name: "Citiq Prepaid", description: "Third-party prepaid sub-metering solution commonly used in residential and commercial buildings." },
          { id: "voltex", name: "Voltex", description: "Electrical metering and distribution equipment supplier; often used in sub-metering installations." },
          { id: "landlord_submetering", name: "Landlord-managed Sub-metering", description: "Property-managed meters linked to the bulk municipal or Eskom account." },
        ],
      },
      {
        id: "generator_backup",
        name: "Generator / Backup Power",
        providers: [
          { id: "aggreko", name: "Aggreko", description: "Temporary and permanent generator rental solutions for load shedding resilience." },
          { id: "mantis", name: "Mantis Energy", description: "Generator supply, installation and maintenance for commercial properties." },
          { id: "landlord_diesel", name: "Landlord Diesel Account", description: "Property-managed diesel procurement and cost recovery for backup generators." },
        ],
      },
      {
        id: "solar_renewable",
        name: "Solar / Renewable",
        providers: [
          { id: "coj_sseg", name: "City of Johannesburg SSEG", description: "Small-scale embedded generation feed-in programme for CoJ properties." },
          { id: "coct_sseg", name: "City of Cape Town SSEG", description: "Cape Town small-scale embedded generation programme allowing surplus solar export." },
          { id: "ipps", name: "Independent Power Producers (IPPs)", description: "Private renewable energy generators supplying properties via PPAs or direct offtake." },
          { id: "ders", name: "Distributed Energy Retailers (DERs)", description: "Aggregators and retailers of rooftop solar and renewable energy for commercial properties." },
        ],
      },
    ],
  },
  {
    id: "water_sanitation",
    name: "Water & Sanitation",
    icon: "💧",
    description: "Water and sanitation providers by municipality, covering potable water, sewerage, stormwater, irrigation and fire suppression.",
    subcategories: [
      {
        id: "potable_water",
        name: "Potable Water",
        providers: [
          { id: "jw", name: "City of Johannesburg (Johannesburg Water)", description: "Bulk water supply and distribution for Johannesburg properties." },
          { id: "cot_water", name: "City of Tshwane", description: "Water supply and distribution for the Tshwane metropolitan area." },
          { id: "coct_water", name: "City of Cape Town", description: "Potable water supply for Cape Town properties; tiered tariff structure applies." },
          { id: "ethekwini_water", name: "eThekwini Water & Sanitation", description: "Water supply for Durban and surrounding KwaZulu-Natal municipalities." },
          { id: "ekurhuleni_water", name: "Ekurhuleni Water", description: "Water distribution for the Ekurhuleni East Rand region." },
        ],
      },
      {
        id: "sanitation_sewerage",
        name: "Sanitation / Sewerage",
        providers: [
          { id: "jw_sanitation", name: "City of Johannesburg (Johannesburg Water)", description: "Sewerage and wastewater services; billed as a % of water consumption." },
          { id: "cot_sanitation", name: "City of Tshwane", description: "Sanitation services for the Tshwane metropolitan area." },
          { id: "coct_sanitation", name: "City of Cape Town", description: "Cape Town sanitation charges; includes effluent quality surcharges where applicable." },
          { id: "ethekwini_sanitation", name: "eThekwini Water & Sanitation", description: "Sanitation and sewerage services for the Durban metro." },
        ],
      },
      {
        id: "stormwater_drainage",
        name: "Stormwater Drainage",
        providers: [
          { id: "municipal_stormwater", name: "Municipal (all metros)", description: "Stormwater levies included in municipal rates or separate billing depending on metro." },
        ],
      },
      {
        id: "irrigation_borehole",
        name: "Irrigation / Borehole",
        providers: [
          { id: "landlord_borehole", name: "Landlord-managed (private)", description: "Privately sourced borehole water; costs include electricity for pumping and treatment." },
          { id: "dws", name: "Dept of Water & Sanitation", description: "Borehole abstraction licensing authority; governs legal groundwater extraction." },
        ],
      },
      {
        id: "fire_suppression",
        name: "Fire Suppression",
        providers: [
          { id: "landlord_fire", name: "Landlord (via Municipal Supply)", description: "Fire suppression water drawn from the municipal supply; costed via the landlord account." },
        ],
      },
    ],
  },
  {
    id: "rates_levies",
    name: "Rates & Levies",
    icon: "🏛",
    description: "Municipal rates, refuse removal, CSOS levies, BID levies and development charges across major South African metros.",
    subcategories: [
      {
        id: "assessment_rates",
        name: "Assessment Rates",
        providers: [
          { id: "coj_rates", name: "City of Johannesburg", description: "Annual property rates based on municipal valuation; billed monthly." },
          { id: "cot_rates", name: "City of Tshwane", description: "Municipal property rates for Tshwane; includes various property categories." },
          { id: "coct_rates", name: "City of Cape Town", description: "Property rates for Cape Town metro; residential and commercial differentiated." },
          { id: "ethekwini_rates", name: "eThekwini Municipality", description: "Assessment rates for Durban metro properties." },
          { id: "ekurhuleni_rates", name: "Ekurhuleni Metropolitan Municipality", description: "Property rates for East Rand region properties." },
        ],
      },
      {
        id: "refuse_removal",
        name: "Refuse Removal",
        providers: [
          { id: "pikitup", name: "Pikitup (Johannesburg)", description: "Municipal solid waste collection entity for Johannesburg." },
          { id: "tshwane_waste", name: "Tshwane Waste", description: "Municipal waste collection service for Tshwane metro properties." },
          { id: "coct_waste", name: "City of Cape Town Solid Waste", description: "Cape Town municipal refuse and waste management services." },
          { id: "ethekwini_waste", name: "eThekwini Cleansing & Solid Waste", description: "Waste collection services for the eThekwini/Durban metro." },
        ],
      },
      {
        id: "csos_levy",
        name: "CSOS Levy",
        providers: [
          { id: "csos", name: "Community Schemes Ombud Service (CSOS)", description: "National regulator; levy applicable to sectional title and community schemes." },
        ],
      },
      {
        id: "bid_levy",
        name: "Improvement District (BID)",
        providers: [
          { id: "jhb_bid", name: "Johannesburg Inner City Improvement District", description: "BID levy for properties in the Johannesburg CBD precinct." },
          { id: "sandton_bid", name: "Sandton City Improvement District", description: "Levies for properties within the Sandton CBD improvement zone." },
          { id: "ct_bid", name: "Cape Town Central City Improvement District", description: "BID levies for properties in the Cape Town CBD precinct." },
          { id: "property_bid", name: "Property-specific BID", description: "Various BIDs exist across South African cities; applies based on property location." },
        ],
      },
      {
        id: "dsw_charges",
        name: "DSW / Development Charges",
        providers: [
          { id: "municipal_dsw", name: "Municipal (all metros)", description: "Development services and infrastructure contributions billed by respective municipalities." },
        ],
      },
    ],
  },
  {
    id: "gas",
    name: "Gas",
    icon: "🔥",
    description: "Natural gas, LPG and bulk gas supply providers for commercial and industrial property applications.",
    subcategories: [
      {
        id: "natural_gas",
        name: "Natural Gas (Piped)",
        providers: [
          { id: "egoli_gas", name: "Egoli Gas", description: "Piped natural gas distribution network primarily serving Johannesburg." },
          { id: "sasol_gas", name: "SASOL Gas", description: "National natural gas producer and distributor; supply to industrial and commercial properties." },
          { id: "renergen", name: "Renergen", description: "Emerging South African natural gas and helium producer with growing distribution footprint." },
        ],
      },
      {
        id: "lpg_bottled",
        name: "LPG / Bottled Gas",
        providers: [
          { id: "afrox", name: "Afrox", description: "Leading LPG supplier; bulk, cylinder and autogas supply across South Africa." },
          { id: "totalgaz", name: "TotalEnergies (Totalgaz)", description: "LPG distribution including bulk supply and cylinder exchange for commercial users." },
          { id: "easigas", name: "Easigas (Chevron)", description: "LPG cylinder and bulk supply for commercial, industrial and hospitality properties." },
          { id: "puma_energy", name: "Puma Energy", description: "Fuel and LPG distribution for commercial and industrial customers." },
        ],
      },
      {
        id: "bulk_gas",
        name: "Bulk Gas Supply",
        providers: [
          { id: "sasol_bulk", name: "SASOL Gas Bulk", description: "Large-volume natural gas supply for industrial and high-consumption commercial users." },
          { id: "afrox_bulk", name: "Afrox Bulk", description: "Bulk LPG and industrial gas supply solutions for large properties and industrial parks." },
        ],
      },
    ],
  },
  {
    id: "telecoms_connectivity",
    name: "Telecoms & Connectivity",
    icon: "📡",
    description: "Fibre internet, satellite TV and Building Management System (BMS) connectivity providers for commercial properties.",
    subcategories: [
      {
        id: "fibre_internet",
        name: "Fibre / Internet",
        providers: [
          { id: "vumatel", name: "Vumatel", description: "Open-access fibre network; widely deployed in residential and commercial precincts." },
          { id: "openserve", name: "Openserve (Telkom)", description: "Telkom fibre network subsidiary; national footprint across residential and commercial areas." },
          { id: "frogfoot", name: "Frogfoot Networks", description: "Open-access fibre network with growing commercial and mixed-use building coverage." },
          { id: "metrofibre", name: "MetroFibre Networx", description: "Fibre infrastructure provider for commercial and multi-tenanted buildings." },
          { id: "link_africa", name: "Link Africa", description: "Fibre and wireless broadband provider targeting commercial and residential complexes." },
          { id: "octotel", name: "Octotel", description: "Western Cape-focused fibre network provider for residential and light commercial use." },
        ],
      },
      {
        id: "satellite_dstv",
        name: "Satellite / DSTV",
        providers: [
          { id: "multichoice", name: "MultiChoice (DStv)", description: "Communal satellite TV infrastructure for multi-dwelling and commercial properties." },
          { id: "starsat", name: "StarSat (TopTV)", description: "Alternative satellite broadcasting provider for communal building installations." },
        ],
      },
      {
        id: "bms_connectivity",
        name: "BMS Connectivity",
        providers: [
          { id: "johnson_controls_bms", name: "Johnson Controls", description: "Building management systems integration and connectivity for large commercial buildings." },
          { id: "honeywell_bms", name: "Honeywell", description: "Smart building automation and BMS platforms for commercial and industrial properties." },
          { id: "schneider_bms", name: "Schneider Electric", description: "EcoStruxure BMS platform; energy and building management for commercial properties." },
          { id: "siemens_bms", name: "Siemens Building Technologies", description: "Intelligent building infrastructure and BMS solutions." },
        ],
      },
    ],
  },
  {
    id: "hvac",
    name: "HVAC",
    icon: "❄️",
    description: "Heating, ventilation and air-conditioning system providers including chilled water, steam and mechanical ventilation.",
    subcategories: [
      {
        id: "chilled_water",
        name: "Centralised Chilled Water",
        providers: [
          { id: "johnson_controls_hvac", name: "Johnson Controls", description: "Chilled water plant design, installation and maintenance for large commercial buildings." },
          { id: "carrier", name: "Carrier", description: "Commercial HVAC and chilled water systems; widely used in office and retail properties." },
          { id: "trane", name: "Trane Technologies", description: "Commercial chilled water and HVAC systems for large-scale property applications." },
          { id: "landlord_plant", name: "Landlord-managed Plant", description: "Property-owned centralised plant managed directly by the landlord or facilities team." },
        ],
      },
      {
        id: "steam_heating",
        name: "Steam / Heating",
        providers: [
          { id: "landlord_boiler", name: "Landlord-managed Boiler", description: "Property-owned boiler systems for centralised heating; cost recovered via service charges." },
        ],
      },
      {
        id: "mechanical_ventilation",
        name: "Mechanical Ventilation",
        providers: [
          { id: "landlord_ventilation", name: "Landlord via Maintenance Contract", description: "Mechanical ventilation systems maintained under building service contracts." },
        ],
      },
    ],
  },
  {
    id: "waste_management",
    name: "Waste Management",
    icon: "♻️",
    description: "Waste collection, recycling, hazardous waste disposal and skip services for commercial property portfolios.",
    subcategories: [
      {
        id: "general_waste",
        name: "General Waste",
        providers: [
          { id: "pikitup_waste", name: "Pikitup (Johannesburg)", description: "Municipal general waste collection service for Johannesburg properties." },
          { id: "enviroserv", name: "EnviroServ", description: "Private waste management company serving commercial and industrial properties nationally." },
          { id: "averda", name: "Averda", description: "Integrated waste management solutions for commercial, industrial and municipal clients." },
          { id: "wasteman", name: "WasteMan (Western Cape)", description: "Regional waste collection and management for Western Cape commercial properties." },
          { id: "suez", name: "SUEZ South Africa", description: "Environmental services including waste collection, treatment and disposal." },
        ],
      },
      {
        id: "recycling",
        name: "Recycling",
        providers: [
          { id: "mpact", name: "Mpact Recycling", description: "Paper and packaging recycling; buy-back and collection services nationally." },
          { id: "nampak", name: "Nampak Recycling", description: "Metal, glass and plastic recycling collection for commercial properties." },
          { id: "collect_a_can", name: "Collect-a-Can", description: "Aluminium and steel can recycling programme; national collection footprint." },
        ],
      },
      {
        id: "hazardous_waste",
        name: "Hazardous Waste",
        providers: [
          { id: "enviroserv_haz", name: "EnviroServ Waste Management", description: "Specialist hazardous waste treatment, storage and disposal services." },
          { id: "interwaste", name: "Interwaste", description: "Integrated hazardous and industrial waste management services." },
          { id: "wasteman_haz", name: "Wasteman Hazardous", description: "Specialist hazardous waste collection and disposal for commercial properties." },
        ],
      },
      {
        id: "skip_services",
        name: "Skip Services",
        providers: [
          { id: "skip_it", name: "Skip-It", description: "Skip bin hire and waste removal for renovation, bulk waste and construction debris." },
          { id: "wasteman_skips", name: "WasteMan Skips", description: "Skip hire services for commercial and residential properties in the Western Cape." },
          { id: "municipal_skips", name: "Municipal Skip Services", description: "Municipality-provided bulk waste removal; availability varies by metro." },
        ],
      },
    ],
  },
  {
    id: "security_access",
    name: "Security & Access",
    icon: "🔒",
    description: "Physical security, CCTV monitoring and access control system providers for commercial buildings.",
    subcategories: [
      {
        id: "physical_security",
        name: "Physical Security",
        providers: [
          { id: "adt", name: "ADT Security", description: "Alarm monitoring, armed response and access control for commercial properties." },
          { id: "fidelity", name: "Fidelity Services Group (Fidelity ADT)", description: "Security services including guarding, armed response and cash management." },
          { id: "g4s", name: "G4S (Allied Universal)", description: "Integrated security services including manned guarding, risk management and technology." },
          { id: "bidvest_protea", name: "Bidvest Protea Coin", description: "Guarding, security management and risk solutions for commercial and industrial sites." },
          { id: "chubb", name: "Chubb Security", description: "Electronic security systems, fire detection and integrated security solutions." },
        ],
      },
      {
        id: "cctv_monitoring",
        name: "CCTV & Monitoring",
        providers: [
          { id: "adt_monitoring", name: "ADT Monitoring", description: "24/7 alarm and CCTV monitoring services for commercial and residential properties." },
          { id: "hikvision", name: "Hikvision", description: "Leading CCTV hardware manufacturer; IP cameras and NVR systems widely used in SA." },
          { id: "dahua", name: "Dahua Technology", description: "CCTV and surveillance hardware for commercial building installations." },
        ],
      },
      {
        id: "access_control",
        name: "Access Control",
        providers: [
          { id: "impro", name: "Impro Technologies", description: "Access control hardware and software solutions; widely deployed in SA commercial buildings." },
          { id: "gallagher", name: "Gallagher Security", description: "Enterprise access control and security management systems." },
          { id: "zkteco", name: "ZKTeco", description: "Biometric and RFID access control systems for commercial properties." },
          { id: "suprema", name: "Suprema", description: "Biometric access control solutions for office and industrial environments." },
        ],
      },
    ],
  },
  {
    id: "common_area_services",
    name: "Common Area Services",
    icon: "🏢",
    description: "Providers for shared building services including lifts, communal lighting, landscaping, cleaning and parking management.",
    subcategories: [
      {
        id: "lifts_elevators",
        name: "Lifts & Elevators",
        providers: [
          { id: "otis", name: "Otis Elevator Company", description: "Installation, maintenance and modernisation of elevators for commercial buildings." },
          { id: "kone", name: "KONE Elevators", description: "Elevator and escalator solutions with maintenance contracts for commercial properties." },
          { id: "schindler", name: "Schindler Lifts", description: "Elevator installation and maintenance; strong commercial building presence in SA." },
          { id: "thyssenkrupp", name: "Thyssenkrupp Elevator", description: "Elevator, escalator and moving walk solutions for large commercial and retail buildings." },
        ],
      },
      {
        id: "communal_lighting",
        name: "Communal Lighting",
        providers: [
          { id: "landlord_lighting", name: "Landlord (via Municipal Electricity)", description: "Common area lighting powered through the landlord municipal electricity account." },
          { id: "philips", name: "Philips Lighting (Signify)", description: "LED and smart lighting solutions for commercial common areas." },
        ],
      },
      {
        id: "landscaping",
        name: "Landscaping & Irrigation",
        providers: [
          { id: "bidvest_fm", name: "Bidvest Facilities Management", description: "Integrated facilities management including landscaping and grounds maintenance." },
          { id: "landlord_landscaping", name: "Landlord-contracted Landscaper", description: "Property-specific landscaping contractor appointed by the landlord." },
        ],
      },
      {
        id: "cleaning",
        name: "Cleaning Services",
        providers: [
          { id: "bidvest_cleaning", name: "Bidvest Cleaning", description: "Commercial cleaning services for offices, retail and industrial properties." },
          { id: "excellerate", name: "Excellerate Services", description: "Integrated facilities and cleaning services for commercial property portfolios." },
          { id: "servest", name: "Servest (Tsebo Group)", description: "Cleaning, catering and facilities management for commercial properties." },
        ],
      },
      {
        id: "parking",
        name: "Parking Management",
        providers: [
          { id: "apcoa", name: "APCOA Parking (Parkade Control)", description: "Parking management solutions for commercial and mixed-use developments." },
          { id: "wilson_parking", name: "Wilson Parking", description: "Managed parking operations for commercial, retail and office properties." },
          { id: "ncp_parking", name: "NCP Parking", description: "Parking management and revenue services for multi-level and surface car parks." },
          { id: "landlord_parking", name: "Landlord-managed", description: "Parking managed directly by the property owner or building management." },
        ],
      },
    ],
  },
  {
    id: "environment_sustainability",
    name: "Environment & Sustainability",
    icon: "🌱",
    description: "Carbon tracking, water recycling, energy efficiency metering and green building certification bodies relevant to SA property portfolios.",
    subcategories: [
      {
        id: "carbon_ghg",
        name: "Carbon / GHG Tracking",
        providers: [
          { id: "carbon_calculated", name: "Carbon Calculated", description: "Carbon footprint measurement and reporting services for property portfolios." },
          { id: "south_pole", name: "South Pole Group", description: "Global sustainability consultancy; carbon accounting and ESG strategy for properties." },
          { id: "dffe", name: "DFFE (Dept of Forestry, Fisheries & Environment)", description: "Regulatory authority for South African carbon tax and GHG reporting compliance." },
        ],
      },
      {
        id: "water_recycling",
        name: "Water Recycling",
        providers: [
          { id: "veolia", name: "Veolia Water", description: "Water recycling, treatment and greywater management solutions." },
          { id: "consolidated_water", name: "Consolidated Water", description: "Water treatment and recycling infrastructure for commercial and industrial properties." },
          { id: "landlord_water_recycling", name: "Landlord-managed Treatment", description: "Greywater and rainwater harvesting systems managed by the property owner." },
        ],
      },
      {
        id: "energy_metering",
        name: "Energy Efficiency Metering",
        providers: [
          { id: "citiq_metering", name: "Citiq Prepaid", description: "Advanced sub-metering and prepaid energy management for commercial buildings." },
          { id: "landis_gyr", name: "Landis+Gyr", description: "Smart metering infrastructure and energy data management solutions." },
          { id: "schneider_metering", name: "Schneider Electric (EcoStruxure)", description: "Integrated energy monitoring and optimisation platform for commercial properties." },
        ],
      },
      {
        id: "green_certification",
        name: "Green Building Certification",
        providers: [
          { id: "gbcsa", name: "GBCSA (Green Building Council SA)", description: "South African green building rating authority; Green Star certification." },
          { id: "edge", name: "EDGE (IFC / World Bank)", description: "Resource efficiency certification for buildings in emerging markets." },
          { id: "breeam", name: "BREEAM", description: "UK-originated international green building assessment methodology." },
          { id: "leed", name: "LEED", description: "US Green Building Council internationally recognised green building standard." },
        ],
      },
    ],
  },
];

async function seedFirestore() {
  console.log("🚀 Starting Firestore seed...");

  for (const category of utilityData) {
    const { subcategories, ...categoryData } = category;

    const categoryRef = db.collection("utilities").doc(category.id);
    await categoryRef.set(categoryData);
    console.log(`\n✅ Category: ${category.name}`);

    for (const subcategory of subcategories) {
      const { providers, ...subcategoryData } = subcategory;

      const subcategoryRef = categoryRef
        .collection("subcategories")
        .doc(subcategory.id);
      await subcategoryRef.set(subcategoryData);
      console.log(`   ↳ Subcategory: ${subcategory.name}`);

      for (const provider of providers) {
        const providerRef = subcategoryRef
          .collection("providers")
          .doc(provider.id);
        await providerRef.set(provider);
        console.log(`      ↳ Provider: ${provider.name}`);
      }
    }
  }

  console.log("\n🎉 Firestore seed complete! All data has been written.");
  process.exit(0);
}

seedFirestore().catch((err) => {
  console.error("❌ Error seeding Firestore:", err);
  process.exit(1);
});
