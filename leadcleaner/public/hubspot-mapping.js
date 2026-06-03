/**
 * hubspot-mapping.js — normalizzazione valori → formato accettato da HubSpot.
 *
 * Nasce dal feedback di Federica (giu 2026): l'import HubSpot scartava i valori
 * perché non combaciavano con i dropdown predefiniti ("Invalid enumeration option").
 *
 * Cosa normalizza:
 *  - Number of Employees: numero grezzo Apollo → range HubSpot (5-25, 25-50, ...)
 *  - Company Size (= REVENUE su HubSpot): fatturato grezzo → range (< 2 million, ...)
 *  - Industry: stringa Apollo → label esatta della property "Industry" HubSpot
 *  - Industry ridotte: label Industry → categoria della property "Industry ridotte"
 *  - Title Case: prima lettera maiuscola per ogni parola sui campi di testo
 *
 * NB su HubSpot:
 *  - "Number of Employees" = numero dipendenti (range)
 *  - "Company Size"        = fatturato/revenue (range)   ← non i dipendenti!
 *
 * Funziona sia nel browser (window.HubSpotMapping) sia in Node (module.exports).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HubSpotMapping = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * 1. NUMBER OF EMPLOYEES → range HubSpot
   * ------------------------------------------------------------------ */
  // Range esatti del dropdown HubSpot. Lower-inclusive, upper-exclusive.
  function employeesRange(value) {
    const n = parseInt(value, 10);
    if (!n || n <= 0) return '';
    if (n < 25)   return '5-25';
    if (n < 50)   return '25-50';
    if (n < 100)  return '50-100';
    if (n < 500)  return '100-500';
    if (n < 1000) return '500-1000';
    return '1000+';
  }

  /* ------------------------------------------------------------------ *
   * 2. COMPANY SIZE (REVENUE) → range HubSpot
   * ------------------------------------------------------------------ */
  // Apollo dà il fatturato in valore assoluto (USD). 0/null = sconosciuto → vuoto.
  function revenueRange(value) {
    const n = Number(value);
    if (!n || n <= 0) return '';
    if (n < 2000000)  return '< 2 million';
    if (n < 10000000) return '< 10 million';
    if (n < 50000000) return '< 50 million';
    return '≥ 50 million';
  }

  /* ------------------------------------------------------------------ *
   * 3. TITLE CASE
   * ------------------------------------------------------------------ */
  // Acronimi/sigle da tenere maiuscole (altrimenti "CEO" → "Ceo").
  const ACRONYMS = new Set([
    'IT','ICT','CEO','CTO','CIO','CFO','COO','CMO','CCO','CDO','CHRO',
    'CRM','ERP','HR','VP','SVP','EVP','AVP','PR','UK','US','USA','EU','UAE',
    'B2B','B2C','D2C','SAAS','PAAS','IAAS','AI','ML','UX','UI','QA','R&D',
    'SEO','SEM','API','EMEA','APAC','DACH','PA','SPA','SRL','GMBH','LLC','LTD',
    'BV','NV','AG','SA','IBM','SAP','AWS'
  ]);

  function titleCaseWord(part) {
    if (!part) return part;
    const up = part.toUpperCase();
    if (ACRONYMS.has(up)) return up;
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  }

  // Capitalizza ogni parola; tratta spazi, '-', "'", '/' come separatori
  // mantenendoli (così "D'Ieteren", "Coca-Cola", "Telecom/Media" restano corretti).
  function titleCase(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .split(/(\s+)/)
      .map(tok => {
        if (/^\s*$/.test(tok)) return tok;
        return tok.split(/([\-'/.])/).map(seg => {
          if (/^[\-'/.]$/.test(seg)) return seg;
          return titleCaseWord(seg);
        }).join('');
      })
      .join('')
      .trim();
  }

  /* ------------------------------------------------------------------ *
   * 4. INDUSTRY → label HubSpot
   * ------------------------------------------------------------------ */
  // Tutte le label ATTIVE (non [HIDDEN]) della property "Industry" HubSpot.
  const HUBSPOT_INDUSTRIES = [
    'Accounting','Agriculture','Airlines/Aviation','Alternative Dispute Resolution',
    'Alternative Medicine','Animation','Apparel & Fashion','Architecture & Planning',
    'Arts and Crafts','Automotive','Banking','Biotechnology','Broadcast Media',
    'Building Materials','Business Supplies and Equipment','Capital Markets','Chemicals',
    'Civic & Social Organization','Civil Engineering','Commercial Real Estate',
    'Computer & Network Security','Computer Games','Computer Hardware','Computer Networking',
    'Computer Software','Construction','Consumer Electronics','Consumer Goods',
    'Consumer Services','Cosmetics','Dairy','Defense & Space','Design','E-Learning',
    'Education Management','Electrical/Electronic Manufacturing','Entertainment',
    'Environmental Services','Events Services','Executive Office','Facilities Services',
    'Farming','Financial Services','Fine Art','Fishery','Food & Beverages','Food Production',
    'Fund-Raising','Furniture','Gambling & Casinos','Glass, Ceramics & Concrete',
    'Government Administration','Government Relations','Graphic Design',
    'Health, Wellness and Fitness','Higher Education','Hospital & Health Care','Hospitality',
    'Human Resources','Import and Export','Individual & Family Services','Industrial Automation',
    'Information Services','Information Technology and Services','Insurance',
    'International Affairs','International Trade and Development','Internet','Investment Banking',
    'Investment Management','Judiciary','Law Enforcement','Law Practice','Legal Services',
    'Legislative Office','Leisure, Travel & Tourism','Libraries','Logistics and Supply Chain',
    'Luxury Goods & Jewelry','Machinery','Managed Print Services','Management Consulting',
    'Manufacturing','Maritime','Market Research','Mechanical or Industrial Engineering',
    'Media','Media Production','Medical Devices','Medical Practice','Mental Health Care',
    'Military','Mining & Metals','Motion Pictures and Film','Museums and Institutions','Music',
    'Nanotechnology','Newspapers','Non-Profit Organization Management','Oil & Energy',
    'Online Media','Other','Outsourcing/Offshoring','Package/Freight Delivery',
    'Packaging and Containers','Paper & Forest Products','Performing Arts','Pharmaceuticals',
    'Philanthropy','Photography','Plastics','Political Organization','Primary/Secondary Education',
    'Printing','Professional Training & Coaching','Program Development','Public Policy',
    'Public Relations and Communications','Public Safety','Publishing','Railroad Manufacture',
    'Ranching','Real Estate','Recreational','Religious Institutions','Renewables & Environment',
    'Research','Restaurants','Retail','Security and Investigations','Semiconductors',
    'Shipbuilding','Sporting Goods','Sports','Staffing and Recruiting','Supermarkets',
    'Telecommunications','Textiles','Think Tanks','Tobacco','Translation and Localization',
    'Transportation/Trucking/Railroad','Utilities','Venture Capital & Private Equity',
    'Veterinary','Warehousing','Wholesale','Wine and Spirits','Wireless','Writing and Editing',
    'Health Care','Aviation & Aerospace','Consulting','Food and Beverage'
  ];

  // chiave normalizzata: minuscolo, & → and, via tutto ciò che non è alfanumerico.
  function normIndustryKey(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '');
  }

  // Indice label-canonica per lookup robusto (gestisce "&" vs "and", punteggiatura, case).
  const INDUSTRY_INDEX = {};
  HUBSPOT_INDUSTRIES.forEach(label => { INDUSTRY_INDEX[normIndustryKey(label)] = label; });

  // Alias per i casi in cui Apollo usa una dicitura diversa dalla label HubSpot
  // (i "4 leggermente diversi" segnalati da Federica + varianti note Apollo/LinkedIn).
  const INDUSTRY_ALIASES = {
    'informationtechnologyandservices': 'Information Technology and Services',
    'informationtechnologyservices':    'Information Technology and Services',
    'itservices':                       'Information Technology and Services',
    'hospitalandhealthcare':            'Hospital & Health Care',
    'healthwellnessandfitness':         'Health, Wellness and Fitness',
    'leisuretravelandtourism':          'Leisure, Travel & Tourism',
    'glassceramicsandconcrete':         'Glass, Ceramics & Concrete',
    'oilandenergy':                     'Oil & Energy',
    'oilenergy':                        'Oil & Energy',
    'foodandbeverages':                 'Food & Beverages',
    'foodandbeverage':                  'Food & Beverages',
    'farming':                          'Farming',
    'wineandspirits':                   'Wine and Spirits',
    'computernetworksecurity':          'Computer & Network Security',
    'mechanicalorindustrialengineering':'Mechanical or Industrial Engineering',
    'paandgovernment':                  'Government Administration',
    'publicsector':                     'Government Administration',
    'telco':                            'Telecommunications',
    'nonprofitorganizationmanagement':  'Non-Profit Organization Management',
    'realestate':                       'Real Estate',
    'marketingandadvertising':          'Media',
    'graphicdesign':                    'Graphic Design'
  };

  // Apollo → label "Industry" HubSpot. Se non trova match, Title Case del valore grezzo.
  function toHubSpotIndustry(raw) {
    if (!raw) return '';
    const key = normIndustryKey(raw);
    if (!key) return '';
    if (INDUSTRY_ALIASES[key]) return INDUSTRY_ALIASES[key];
    if (INDUSTRY_INDEX[key])   return INDUSTRY_INDEX[key];
    return titleCase(raw); // fallback: almeno formattata, da correggere a mano se serve
  }

  /* ------------------------------------------------------------------ *
   * 5. INDUSTRY → INDUSTRY RIDOTTE
   * ------------------------------------------------------------------ */
  // label "Industry" HubSpot → categoria "Industry ridotte" HubSpot.
  const INDUSTRY_TO_RIDOTTA = {
    'Accounting': 'Banking & Finance',
    'Agriculture': 'Rural Sectors',
    'Airlines/Aviation': 'Aviation & Aerospace',
    'Alternative Dispute Resolution': 'Judiciary & Law',
    'Alternative Medicine': 'Health Care',
    'Animation': 'Media, Publishing & Design',
    'Apparel & Fashion': 'Apparel & Fashion',
    'Architecture & Planning': 'Constructions & Engineering',
    'Arts and Crafts': 'Culture & Arts',
    'Automotive': 'Automotive',
    'Banking': 'Banking & Finance',
    'Biotechnology': 'Biotechnology',
    'Broadcast Media': 'Media, Publishing & Design',
    'Building Materials': 'Manufacturing & Raw materials',
    'Business Supplies and Equipment': 'Business Supplies and Equipment',
    'Capital Markets': 'Banking & Finance',
    'Chemicals': 'Chemicals',
    'Civic & Social Organization': 'Civic & Social Organization',
    'Civil Engineering': 'Constructions & Engineering',
    'Commercial Real Estate': 'Real Estate',
    'Computer & Network Security': 'IT, Computer & Electronics',
    'Computer Games': 'Entertainment & Gaming',
    'Computer Hardware': 'IT, Computer & Electronics',
    'Computer Networking': 'IT, Computer & Electronics',
    'Computer Software': 'IT, Computer & Electronics',
    'Construction': 'Constructions & Engineering',
    'Consumer Electronics': 'IT, Computer & Electronics',
    'Consumer Goods': 'Consumer Goods & Services',
    'Consumer Services': 'Consumer Goods & Services',
    'Cosmetics': 'Cosmetics',
    'Dairy': 'Rural Sectors',
    'Defense & Space': 'Aviation & Aerospace',
    'Design': 'Media, Publishing & Design',
    'E-Learning': 'Education Management',
    'Education Management': 'Education Management',
    'Electrical/Electronic Manufacturing': 'Manufacturing & Raw materials',
    'Entertainment': 'Entertainment & Gaming',
    'Environmental Services': 'Environmental Services',
    'Events Services': 'Marketing & Events',
    'Executive Office': 'Government',
    'Facilities Services': 'Consumer Goods & Services',
    'Farming': 'Rural Sectors',
    'Financial Services': 'Banking & Finance',
    'Fine Art': 'Culture & Arts',
    'Fishery': 'Rural Sectors',
    'Food & Beverages': 'Food & Beverages',
    'Food Production': 'Food & Beverages',
    'Fund-Raising': 'Charity & Fund-Raising',
    'Furniture': 'Furniture',
    'Gambling & Casinos': 'Entertainment & Gaming',
    'Glass, Ceramics & Concrete': 'Manufacturing & Raw materials',
    'Government Administration': 'Government',
    'Government Relations': 'Government',
    'Graphic Design': 'Media, Publishing & Design',
    'Health, Wellness and Fitness': 'Health Care',
    'Higher Education': 'Education Management',
    'Hospital & Health Care': 'Health Care',
    'Hospitality': 'Travel & Tourism',
    'Human Resources': 'Human Resources',
    'Import and Export': 'Import & Export',
    'Individual & Family Services': 'Consumer Goods & Services',
    'Industrial Automation': 'Manufacturing & Raw materials',
    'Information Services': 'IT, Computer & Electronics',
    'Information Technology and Services': 'IT, Computer & Electronics',
    'Insurance': 'Insurance',
    'International Affairs': 'Business, Trade & International Affairs',
    'International Trade and Development': 'Business, Trade & International Affairs',
    'Internet': 'IT, Computer & Electronics',
    'Investment Banking': 'Banking & Finance',
    'Investment Management': 'Banking & Finance',
    'Judiciary': 'Judiciary & Law',
    'Law Enforcement': 'Judiciary & Law',
    'Law Practice': 'Judiciary & Law',
    'Legal Services': 'Judiciary & Law',
    'Legislative Office': 'Government',
    'Leisure, Travel & Tourism': 'Travel & Tourism',
    'Libraries': 'Culture & Arts',
    'Logistics and Supply Chain': 'Logistics and Supply Chain',
    'Luxury Goods & Jewelry': 'Luxury Goods',
    'Machinery': 'Manufacturing & Raw materials',
    'Managed Print Services': 'Business Supplies and Equipment',
    'Management Consulting': 'Consulting',
    'Manufacturing': 'Manufacturing & Raw materials',
    'Maritime': 'Maritime',
    'Market Research': 'Marketing & Events',
    'Mechanical or Industrial Engineering': 'Constructions & Engineering',
    'Media': 'Media, Publishing & Design',
    'Media Production': 'Media, Publishing & Design',
    'Medical Devices': 'Health Care',
    'Medical Practice': 'Health Care',
    'Mental Health Care': 'Health Care',
    'Military': 'Government',
    'Mining & Metals': 'Manufacturing & Raw materials',
    'Motion Pictures and Film': 'Entertainment & Gaming',
    'Museums and Institutions': 'Culture & Arts',
    'Music': 'Culture & Arts',
    'Nanotechnology': 'Research & Development',
    'Newspapers': 'Media, Publishing & Design',
    'Non-Profit Organization Management': 'Charity & Fund-Raising',
    'Oil & Energy': 'Oil & Energy',
    'Online Media': 'Media, Publishing & Design',
    'Other': 'Other',
    'Outsourcing/Offshoring': 'Consulting',
    'Package/Freight Delivery': 'Logistics and Supply Chain',
    'Packaging and Containers': 'Manufacturing & Raw materials',
    'Paper & Forest Products': 'Manufacturing & Raw materials',
    'Performing Arts': 'Culture & Arts',
    'Pharmaceuticals': 'Health Care',
    'Philanthropy': 'Charity & Fund-Raising',
    'Photography': 'Media, Publishing & Design',
    'Plastics': 'Manufacturing & Raw materials',
    'Political Organization': 'Government',
    'Primary/Secondary Education': 'Education Management',
    'Printing': 'Media, Publishing & Design',
    'Professional Training & Coaching': 'Education Management',
    'Program Development': 'IT, Computer & Electronics',
    'Public Policy': 'Government',
    'Public Relations and Communications': 'Marketing & Events',
    'Public Safety': 'Government',
    'Publishing': 'Media, Publishing & Design',
    'Railroad Manufacture': 'Manufacturing & Raw materials',
    'Ranching': 'Rural Sectors',
    'Real Estate': 'Real Estate',
    'Recreational': 'Sports',
    'Religious Institutions': 'Civic & Social Organization',
    'Renewables & Environment': 'Environmental Services',
    'Research': 'Research & Development',
    'Restaurants': 'Food & Beverages',
    'Retail': 'Retail & Large Scale Distribution',
    'Security and Investigations': 'Judiciary & Law',
    'Semiconductors': 'IT, Computer & Electronics',
    'Shipbuilding': 'Maritime',
    'Sporting Goods': 'Sports',
    'Sports': 'Sports',
    'Staffing and Recruiting': 'Human Resources',
    'Supermarkets': 'Retail & Large Scale Distribution',
    'Telecommunications': 'Telco',
    'Textiles': 'Apparel & Fashion',
    'Think Tanks': 'Research & Development',
    'Tobacco': 'Consumer Goods & Services',
    'Translation and Localization': 'Other',
    'Transportation/Trucking/Railroad': 'Logistics and Supply Chain',
    'Utilities': 'Utilities',
    'Venture Capital & Private Equity': 'Banking & Finance',
    'Veterinary': 'Health Care',
    'Warehousing': 'Logistics and Supply Chain',
    'Wholesale': 'Wholesale',
    'Wine and Spirits': 'Food & Beverages',
    'Wireless': 'Telco',
    'Writing and Editing': 'Media, Publishing & Design',
    'Health Care': 'Health Care',
    'Aviation & Aerospace': 'Aviation & Aerospace',
    'Consulting': 'Consulting',
    'Food and Beverage': 'Food & Beverages'
  };

  // raw (Apollo) → categoria "Industry ridotte". Passa prima per la label canonica.
  function toIndustryRidotta(raw) {
    const full = toHubSpotIndustry(raw);
    if (!full) return '';
    return INDUSTRY_TO_RIDOTTA[full] || 'Other';
  }

  return {
    employeesRange,
    revenueRange,
    titleCase,
    toHubSpotIndustry,
    toIndustryRidotta,
    HUBSPOT_INDUSTRIES,
    INDUSTRY_TO_RIDOTTA
  };
});
