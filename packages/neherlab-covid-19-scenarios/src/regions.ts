/**
 * A mapping of ISO 3166 codes to region specifiers
 *
 * The length of the code determines alpha-2 vs alpha-3, but we prefer the more
 * common alpha-2.
 *
 * A special subregion ID called "_self" represents the entirety of the region.
 *
 * https://en.wikipedia.org/wiki/ISO_3166
 */
export type RegionMap = Record<string, Region>

/**
 * A top-level region, which must have subregions.
 */
export type TopLevelRegion = Region & {
  regions: RegionMap
}

/**
 * A region identified by an ISO 3166
 */
export interface Region {
  /**
   * The human-readable name of the region
   */
  name: string

  /**
   * The ISO 3166-1 alpha-3 three-letter code for the region
   */
  alpha3?: string

  /**
   * The subregions of this region
   */
  regions?: RegionMap
}

export const REGION_DATA: RegionMap = {
  AF: {
    name: 'Afghanistan',
    alpha3: 'AFG',
  },
  AL: {
    name: 'Albania',
    alpha3: 'ALB',
  },
  DZ: {
    name: 'Algeria',
    alpha3: 'DZA',
  },
  AD: {
    name: 'Andorra',
    alpha3: 'AND',
  },
  AG: {
    name: 'Antigua and Barbuda',
    alpha3: 'ATG',
  },
  AR: {
    name: 'Argentina',
    alpha3: 'ARG',
  },
  AM: {
    name: 'Armenia',
    alpha3: 'ARM',
  },
  AU: {
    name: 'Australia',
    alpha3: 'AUS',
  },
  AT: {
    name: 'Austria',
    alpha3: 'AUT',
  },
  AZ: {
    name: 'Azerbaijan',
    alpha3: 'AZE',
  },
  BS: {
    name: 'Bahamas',
    alpha3: 'BHS',
  },
  BH: {
    name: 'Bahrain',
    alpha3: 'BHR',
  },
  BD: {
    name: 'Bangladesh',
    alpha3: 'BGD',
  },
  BB: {
    name: 'Barbados',
    alpha3: 'BRB',
  },
  BY: {
    name: 'Belarus',
    alpha3: 'BLR',
  },
  BE: {
    name: 'Belgium',
    alpha3: 'BEL',
  },
  BZ: {
    name: 'Belize',
    alpha3: 'BLZ',
  },
  BJ: {
    name: 'Benin',
    alpha3: 'BEN',
  },
  BT: {
    name: 'Bhutan',
    alpha3: 'BTN',
  },
  BO: {
    name: 'Bolivia (Plurinational State of)',
    alpha3: 'BOL',
  },
  BA: {
    name: 'Bosnia and Herzegovina',
    alpha3: 'BIH',
  },
  BW: {
    name: 'Botswana',
    alpha3: 'BWA',
  },
  BR: {
    name: 'Brazil',
    alpha3: 'BRA',
  },
  BN: {
    name: 'Brunei Darussalam',
    alpha3: 'BRN',
  },
  BG: {
    name: 'Bulgaria',
    alpha3: 'BGR',
  },
  BF: {
    name: 'Burkina Faso',
    alpha3: 'BFA',
  },
  BI: {
    name: 'Burundi',
    alpha3: 'BDI',
  },
  CV: {
    name: 'Cabo Verde',
    alpha3: 'CPV',
  },
  KH: {
    name: 'Cambodia',
    alpha3: 'KHM',
  },
  CM: {
    name: 'Cameroon',
    alpha3: 'CMR',
  },
  CA: {
    name: 'Canada',
    alpha3: 'CAN',
    regions: {
      'CA-AB': {
        name: 'Alberta',
      },
      'CA-BC': {
        name: 'British Columbia',
      },
      'CA-MB': {
        name: 'Manitoba',
      },
      'CA-NT': {
        name: 'NWT',
      },
      'CA-NB': {
        name: 'New Brunswick',
      },
      'CA-NL': {
        name: 'Newfoundland and Labrador',
      },
      'CA-NS': {
        name: 'Nova Scotia',
      },
      'CA-NU': {
        name: 'Nunavut',
      },
      'CA-ON': {
        name: 'Ontario',
      },
      'CA-PE': {
        name: 'Prince Edward Island',
      },
      'CA-QC': {
        name: 'Quebec',
      },
      'CA-SK': {
        name: 'Saskatchewan',
      },
      'CA-YT': {
        name: 'Yukon',
      },
    },
  },
  CF: {
    name: 'Central African Republic',
    alpha3: 'CAF',
  },
  CL: {
    name: 'Chile',
    alpha3: 'CHL',
  },
  CN: {
    name: 'China',
    alpha3: 'CHN',
  },
  CO: {
    name: 'Colombia',
    alpha3: 'COL',
  },
  KM: {
    name: 'Comoros',
    alpha3: 'COM',
  },
  CR: {
    name: 'Costa Rica',
    alpha3: 'CRI',
  },
  HR: {
    name: 'Croatia',
    alpha3: 'HRV',
  },
  CU: {
    name: 'Cuba',
    alpha3: 'CUB',
  },
  CY: {
    name: 'Cyprus',
    alpha3: 'CYP',
  },
  CZ: {
    name: 'Czechia',
    alpha3: 'CZE',
  },
  DK: {
    name: 'Denmark',
    alpha3: 'DNK',
  },
  DJ: {
    name: 'Djibouti',
    alpha3: 'DJI',
  },
  DM: {
    name: 'Dominica',
    alpha3: 'DMA',
  },
  DO: {
    name: 'Dominican Republic',
    alpha3: 'DOM',
  },
  EC: {
    name: 'Ecuador',
    alpha3: 'ECU',
  },
  EG: {
    name: 'Egypt',
    alpha3: 'EGY',
  },
  SV: {
    name: 'El Salvador',
    alpha3: 'SLV',
  },
  GQ: {
    name: 'Equatorial Guinea',
    alpha3: 'GNQ',
  },
  EE: {
    name: 'Estonia',
    alpha3: 'EST',
  },
  SZ: {
    name: 'Eswatini',
    alpha3: 'SWZ',
  },
  ET: {
    name: 'Ethiopia',
    alpha3: 'ETH',
  },
  FO: {
    name: 'Faroe Islands',
    alpha3: 'FRO',
  },
  FJ: {
    name: 'Fiji',
    alpha3: 'FJI',
  },
  FI: {
    name: 'Finland',
    alpha3: 'FIN',
  },
  FR: {
    name: 'France',
    alpha3: 'FRA',
    regions: {
      'FR-ARA': {
        name: 'Auvergne-Rhône-Alpes',
      },
      'FR-BFC': {
        name: 'Bourgogne-Franche-Comté',
      },
      'FR-BRE': {
        name: 'Bretagne',
      },
      'FR-CVL': {
        name: 'Centre-Val-de-Loire',
      },
      'FR-COR': {
        name: 'Corse',
      },
      'FR-GES': {
        name: 'Grand-Est',
      },
      'FR-GUA': {
        name: 'Guadeloupe',
      },
      'FR-GF': {
        name: 'Guyane',
      },
      'FR-HDF': {
        name: 'Hauts-de-France',
      },
      'FR-IDF': {
        name: 'Ile-de-France',
      },
      'FR-LRE': {
        name: 'La-Réunion',
      },
      'FR-MQ': {
        name: 'Martinique',
      },
      'FR-MAY': {
        name: 'Mayotte',
      },
      'FR-NOR': {
        name: 'Normandie',
      },
      'FR-NAQ': {
        name: 'Nouvelle-Aquitaine',
      },
      'FR-OCC': {
        name: 'Occitanie',
      },
      'FR-PDL': {
        name: 'Pays-de-la-Loire',
      },
      'FR-PAC': {
        name: 'Provence-Alpes-Côte-dAzur',
      },
    },
  },
  GA: {
    name: 'Gabon',
    alpha3: 'GAB',
  },
  GM: {
    name: 'Gambia',
    alpha3: 'GMB',
  },
  GE: {
    name: 'Georgia',
    alpha3: 'GEO',
  },
  DE: {
    name: 'Germany',
    alpha3: 'DEU',
    regions: {
      'DE-BW': {
        name: 'Baden-Württemberg',
      },
      'DE-BY': {
        name: 'Bayern',
      },
      'DE-BE': {
        name: 'Berlin',
      },
      'DE-BB': {
        name: 'Brandenburg',
      },
      'DE-HB': {
        name: 'Bremen',
      },
      'DE-HH': {
        name: 'Hamburg',
      },
      'DE-HE': {
        name: 'Hessen',
      },
      'DE-MV': {
        name: 'Mecklenburg-Vorpommern',
      },
      'DE-NI': {
        name: 'Niedersachsen',
      },
      'DE-NW': {
        name: 'Nordrhein-Westfalen',
      },
      'DE-RP': {
        name: 'Rheinland-Pfalz',
      },
      'DE-SL': {
        name: 'Saarland',
      },
      'DE-SN': {
        name: 'Sachsen',
      },
      'DE-ST': {
        name: 'Sachsen-Anhalt',
      },
      'DE-SH': {
        name: 'Schleswig-Holstein',
      },
      'DE-TH': {
        name: 'Thüringen',
      },
    },
  },
  GH: {
    name: 'Ghana',
    alpha3: 'GHA',
  },
  GI: {
    name: 'Gibraltar',
    alpha3: 'GIB',
  },
  GR: {
    name: 'Greece',
    alpha3: 'GRC',
  },
  GL: {
    name: 'Greenland',
    alpha3: 'GRL',
  },
  GD: {
    name: 'Grenada',
    alpha3: 'GRD',
  },
  GT: {
    name: 'Guatemala',
    alpha3: 'GTM',
  },
  GN: {
    name: 'Guinea',
    alpha3: 'GIN',
  },
  GW: {
    name: 'Guinea-Bissau',
    alpha3: 'GNB',
  },
  GY: {
    name: 'Guyana',
    alpha3: 'GUY',
  },
  HT: {
    name: 'Haiti',
    alpha3: 'HTI',
  },
  HN: {
    name: 'Honduras',
    alpha3: 'HND',
  },
  HK: {
    name: 'Hong Kong',
    alpha3: 'HKG',
  },
  HU: {
    name: 'Hungary',
    alpha3: 'HUN',
  },
  IS: {
    name: 'Iceland',
    alpha3: 'ISL',
  },
  IN: {
    name: 'India',
    alpha3: 'IND',
    regions: {
      'IN-AN': {
        name: 'Andaman & Nicobar Islands',
      },
      'IN-AP': {
        name: 'Andhra Pradesh',
      },
      'IN-AR': {
        name: 'Arunachal Pradesh',
      },
      'IN-AS': {
        name: 'Assam',
      },
      'IN-BR': {
        name: 'Bihar',
      },
      'IN-CH': {
        name: 'Chandigarh',
      },
      'IN-CT': {
        name: 'Chhattisgarh',
      },
      'IN-DN': {
        name: 'Dadra & Nagar Haveli',
      },
      'IN-DD': {
        name: 'Daman & Diu',
      },
      'IN-DL': {
        name: 'Delhi',
      },
      'IN-GA': {
        name: 'Goa',
      },
      'IN-GJ': {
        name: 'Gujarat',
      },
      'IN-HR': {
        name: 'Haryana',
      },
      'IN-HP': {
        name: 'Himachal Pradesh',
      },
      'IN-JK': {
        name: 'Jammu and Kashmir',
      },
      'IN-JH': {
        name: 'Jharkhand',
      },
      'IN-KA': {
        name: 'Karnataka',
      },
      'IN-KL': {
        name: 'Kerala',
      },
      'IN-LD': {
        name: 'Lakshadweep',
      },
      'IN-MP': {
        name: 'Madhya Pradesh',
      },
      'IN-MH': {
        name: 'Maharashtra',
      },
      'IN-MN': {
        name: 'Manipur',
      },
      'IN-ML': {
        name: 'Meghalaya',
      },
      'IN-MZ': {
        name: 'Mizoram',
      },
      'IN-NL': {
        name: 'Nagaland',
      },
      'IN-OR': {
        name: 'Odisha',
      },
      'IN-PY': {
        name: 'Puducherry',
      },
      'IN-PB': {
        name: 'Punjab',
      },
      'IN-RJ': {
        name: 'Rajasthan',
      },
      'IN-SK': {
        name: 'Sikkim',
      },
      'IN-TN': {
        name: 'Tamil Nadu',
      },
      'IN-TH': {
        name: 'Telangana',
      },
      'IN-TR': {
        name: 'Tripura',
      },
      'IN-UP': {
        name: 'Uttar Pradesh',
      },
      'IN-UT': {
        name: 'Uttarakhand',
      },
      'IN-WB': {
        name: 'West Bengal',
      },
    },
  },
  ID: {
    name: 'Indonesia',
    alpha3: 'IDN',
  },
  IR: {
    name: 'Iran (Islamic Republic of)',
    alpha3: 'IRN',
  },
  IQ: {
    name: 'Iraq',
    alpha3: 'IRQ',
  },
  IE: {
    name: 'Ireland',
    alpha3: 'IRL',
  },
  IL: {
    name: 'Israel',
    alpha3: 'ISR',
  },
  IT: {
    name: 'Italy',
    alpha3: 'ITA',
    regions: {
      'IT-65': {
        name: 'Abruzzo',
      },
      'IT-77': {
        name: 'Basilicata',
      },
      'IT-78': {
        name: 'Calabria',
      },
      'IT-72': {
        name: 'Campania',
      },
      'IT-45': {
        name: 'Emilia-Romagna',
      },
      'IT-36': {
        name: 'Friuli Venezia Giulia',
      },
      'IT-62': {
        name: 'Lazio',
      },
      'IT-42': {
        name: 'Liguria',
      },
      'IT-25': {
        name: 'Lombardia',
      },
      'IT-57': {
        name: 'Marche',
      },
      'IT-67': {
        name: 'Molise',
      },
      'IT-BZ': {
        name: 'P.A. Bolzano',
      },
      'IT-TN': {
        name: 'P.A. Trento',
      },
      'IT-21': {
        name: 'Piemonte',
      },
      'IT-75': {
        name: 'Puglia',
      },
      'IT-88': {
        name: 'Sardegna',
      },
      'IT-82': {
        name: 'Sicilia',
      },
      'IT-52': {
        name: 'Toscana',
      },
      'IT-32': {
        name: 'TrentinoAltoAdige',
      },
      'IT-55': {
        name: 'Umbria',
      },
      'IT-23': {
        name: "Valle d'Aosta",
      },
      'IT-34': {
        name: 'Veneto',
      },
    },
  },
  JM: {
    name: 'Jamaica',
    alpha3: 'JAM',
  },
  JP: {
    name: 'Japan',
    alpha3: 'JPN',
    regions: {
      'JP-47': {
        name: 'Okinawa',
      },
    },
  },
  JO: {
    name: 'Jordan',
    alpha3: 'JOR',
  },
  KZ: {
    name: 'Kazakhstan',
    alpha3: 'KAZ',
  },
  KE: {
    name: 'Kenya',
    alpha3: 'KEN',
  },
  KI: {
    name: 'Kiribati',
    alpha3: 'KIR',
  },
  KP: {
    name: "Korea (Democratic People's Republic of)",
    alpha3: 'PRK',
  },
  KR: {
    name: 'Korea, Republic of',
    alpha3: 'KOR',
  },
  KW: {
    name: 'Kuwait',
    alpha3: 'KWT',
  },
  KG: {
    name: 'Kyrgyzstan',
    alpha3: 'KGZ',
  },
  LA: {
    name: "Lao People's Democratic Republic",
    alpha3: 'LAO',
  },
  LV: {
    name: 'Latvia',
    alpha3: 'LVA',
  },
  LB: {
    name: 'Lebanon',
    alpha3: 'LBN',
  },
  LR: {
    name: 'Liberia',
    alpha3: 'LBR',
  },
  LY: {
    name: 'Libya',
    alpha3: 'LBY',
  },
  LI: {
    name: 'Liechtenstein',
    alpha3: 'LIE',
  },
  LT: {
    name: 'Lithuania',
    alpha3: 'LTU',
  },
  LU: {
    name: 'Luxembourg',
    alpha3: 'LUX',
  },
  MG: {
    name: 'Madagascar',
    alpha3: 'MDG',
  },
  MW: {
    name: 'Malawi',
    alpha3: 'MWI',
  },
  MY: {
    name: 'Malaysia',
    alpha3: 'MYS',
  },
  MV: {
    name: 'Maldives',
    alpha3: 'MDV',
  },
  ML: {
    name: 'Mali',
    alpha3: 'MLI',
  },
  MT: {
    name: 'Malta',
    alpha3: 'MLT',
  },
  MH: {
    name: 'Marshall Islands',
    alpha3: 'MHL',
  },
  MU: {
    name: 'Mauritius',
    alpha3: 'MUS',
  },
  MX: {
    name: 'Mexico',
    alpha3: 'MEX',
  },
  FM: {
    name: 'Micronesia (Federated States of)',
    alpha3: 'FSM',
  },
  MD: {
    name: 'Moldova, Republic of',
    alpha3: 'MDA',
  },
  MC: {
    name: 'Monaco',
    alpha3: 'MCO',
  },
  MN: {
    name: 'Mongolia',
    alpha3: 'MNG',
  },
  ME: {
    name: 'Montenegro',
    alpha3: 'MNE',
  },
  MA: {
    name: 'Morocco',
    alpha3: 'MAR',
  },
  MZ: {
    name: 'Mozambique',
    alpha3: 'MOZ',
  },
  MM: {
    name: 'Myanmar',
    alpha3: 'MMR',
  },
  NA: {
    name: 'Namibia',
    alpha3: 'NAM',
  },
  NR: {
    name: 'Nauru',
    alpha3: 'NRU',
  },
  NP: {
    name: 'Nepal',
    alpha3: 'NPL',
  },
  NL: {
    name: 'Netherlands',
    alpha3: 'NLD',
  },
  NZ: {
    name: 'New Zealand',
    alpha3: 'NZL',
  },
  NI: {
    name: 'Nicaragua',
    alpha3: 'NIC',
  },
  MK: {
    name: 'North Macedonia',
    alpha3: 'MKD',
  },
  NO: {
    name: 'Norway',
    alpha3: 'NOR',
  },
  OM: {
    name: 'Oman',
    alpha3: 'OMN',
  },
  PK: {
    name: 'Pakistan',
    alpha3: 'PAK',
  },
  PW: {
    name: 'Palau',
    alpha3: 'PLW',
  },
  PA: {
    name: 'Panama',
    alpha3: 'PAN',
  },
  PY: {
    name: 'Paraguay',
    alpha3: 'PRY',
  },
  PE: {
    name: 'Peru',
    alpha3: 'PER',
  },
  PH: {
    name: 'Philippines',
    alpha3: 'PHL',
    regions: {
      'PH-14': {
        name: 'BARMM',
      },
      'PH-15': {
        name: 'CAR (Cordillera Administrative Region)',
      },
      'PH-00': {
        name: 'NCR',
      },
      'PH-01': {
        name: 'Region 1 (Ilocos Region)',
      },
      'PH-10': {
        name: 'Region 10 (Northern Mindanao)',
      },
      'PH-11': {
        name: 'Region 11 (Davao Region)',
      },
      'PH-12': {
        name: 'Region 12 (Soccskargen)',
      },
      'PH-13': {
        name: 'Region 13 (Caraga)',
      },
      'PH-02': {
        name: 'Region 2 (Cagayan Valley)',
      },
      'PH-03': {
        name: 'Region 3 (Central Luzon)',
      },
      'PH-40': {
        name: 'Region 4A (Calabarzon)',
      },
      'PH-41': {
        name: 'Region 4B (MIMAROPA)',
      },
      'PH-05': {
        name: 'Region 5 (Bicol Region)',
      },
      'PH-06': {
        name: 'Region 6 (Western Visayas)',
      },
      'PH-07': {
        name: 'Region 7 (Central Visayas)',
      },
      'PH-08': {
        name: 'Region 8 (Eastern Visayas)',
      },
      'PH-09': {
        name: 'Region 9 (Zamboanga Peninsula)',
      },
    },
  },
  PL: {
    name: 'Poland',
    alpha3: 'POL',
  },
  PT: {
    name: 'Portugal',
    alpha3: 'PRT',
  },
  QA: {
    name: 'Qatar',
    alpha3: 'QAT',
  },
  RO: {
    name: 'Romania',
    alpha3: 'ROU',
  },
  RU: {
    name: 'Russian Federation',
    alpha3: 'RUS',
  },
  KN: {
    name: 'Saint Kitts and Nevis',
    alpha3: 'KNA',
  },
  LC: {
    name: 'Saint Lucia',
    alpha3: 'LCA',
  },
  VC: {
    name: 'Saint Vincent and the Grenadines',
    alpha3: 'VCT',
  },
  SM: {
    name: 'San Marino',
    alpha3: 'SMR',
  },
  ST: {
    name: 'Sao Tome and Principe',
    alpha3: 'STP',
  },
  SA: {
    name: 'Saudi Arabia',
    alpha3: 'SAU',
  },
  SN: {
    name: 'Senegal',
    alpha3: 'SEN',
  },
  RS: {
    name: 'Serbia',
    alpha3: 'SRB',
  },
  SC: {
    name: 'Seychelles',
    alpha3: 'SYC',
  },
  SG: {
    name: 'Singapore',
    alpha3: 'SGP',
  },
  SK: {
    name: 'Slovakia',
    alpha3: 'SVK',
  },
  SI: {
    name: 'Slovenia',
    alpha3: 'SVN',
  },
  SB: {
    name: 'Solomon Islands',
    alpha3: 'SLB',
  },
  SO: {
    name: 'Somalia',
    alpha3: 'SOM',
  },
  ZA: {
    name: 'South Africa',
    alpha3: 'ZAF',
  },
  ES: {
    name: 'Spain',
    alpha3: 'ESP',
    regions: {
      'ES-AN': {
        name: 'Andalucía',
      },
      'ES-AR': {
        name: 'Aragón',
      },
      'ES-AS': {
        name: 'Asturias',
      },
      'ES-IB': {
        name: 'Baleares',
      },
      'ES-VC': {
        name: 'C. Valenciana',
      },
      'ES-CN': {
        name: 'Canarias',
      },
      'ES-CB': {
        name: 'Cantabria',
      },
      'ES-CL': {
        name: 'Castilla y León',
      },
      'ES-CM': {
        name: 'Castilla-La Mancha',
      },
      'ES-CT': {
        name: 'Cataluña',
      },
      'ES-CE': {
        name: 'Ceuta',
      },
      'ES-EX': {
        name: 'Extremadura',
      },
      'ES-GA': {
        name: 'Galicia',
      },
      'ES-RI': {
        name: 'La Rioja',
      },
      'ES-MD': {
        name: 'Madrid',
      },
      'ES-ML': {
        name: 'Melilla',
      },
      'ES-MC': {
        name: 'Murcia',
      },
      'ES-NC': {
        name: 'Navarra',
      },
      'ES-PV': {
        name: 'País Vasco',
      },
    },
  },
  LK: {
    name: 'Sri Lanka',
    alpha3: 'LKA',
  },
  SD: {
    name: 'Sudan',
    alpha3: 'SDN',
  },
  SR: {
    name: 'Suriname',
    alpha3: 'SUR',
  },
  SE: {
    name: 'Sweden',
    alpha3: 'SWE',
    regions: {
      'SE-AB': {
        name: 'Stockholm',
      },
    },
  },
  CH: {
    name: 'Switzerland',
    alpha3: 'CHE',
    regions: {
      'CH-AG': {
        name: 'Aargau',
      },
      'CH-AR': {
        name: 'Appenzell Ausserrhoden',
      },
      'CH-AI': {
        name: 'Appenzell Innerrhoden',
      },
      'CH-BL': {
        name: 'Basel-Landschaft',
      },
      'CH-BS': {
        name: 'Basel-Stadt',
      },
      'CH-BE': {
        name: 'Bern',
      },
      'CH-FR': {
        name: 'Fribourg',
      },
      'CH-GE': {
        name: 'Geneva',
      },
      'CH-GL': {
        name: 'Glarus',
      },
      'CH-GR': {
        name: 'Graubünden',
      },
      'CH-JU': {
        name: 'Jura',
      },
      'CH-LU': {
        name: 'Luzern',
      },
      'CH-NE': {
        name: 'Neuchâtel',
      },
      'CH-NW': {
        name: 'Nidwalden',
      },
      'CH-OW': {
        name: 'Obwalden',
      },
      'CH-SH': {
        name: 'Schaffhausen',
      },
      'CH-SZ': {
        name: 'Schwyz',
      },
      'CH-SO': {
        name: 'Solothurn',
      },
      'CH-SG': {
        name: 'St. Gallen',
      },
      'CH-TG': {
        name: 'Thurgau',
      },
      'CH-TI': {
        name: 'Ticino',
      },
      'CH-UR': {
        name: 'Uri',
      },
      'CH-VS': {
        name: 'Valais',
      },
      'CH-VD': {
        name: 'Vaud',
      },
      'CH-ZG': {
        name: 'Zug',
      },
      'CH-ZH': {
        name: 'Zürich',
      },
    },
  },
  SY: {
    name: 'Syrian Arab Republic',
    alpha3: 'SYR',
  },
  TW: {
    name: 'Taiwan, Province of China',
    alpha3: 'TWN',
  },
  TJ: {
    name: 'Tajikistan',
    alpha3: 'TJK',
  },
  TZ: {
    name: 'Tanzania, United Republic of',
    alpha3: 'TZA',
  },
  TH: {
    name: 'Thailand',
    alpha3: 'THA',
  },
  TL: {
    name: 'Timor-Leste',
    alpha3: 'TLS',
  },
  TG: {
    name: 'Togo',
    alpha3: 'TGO',
  },
  TO: {
    name: 'Tonga',
    alpha3: 'TON',
  },
  TT: {
    name: 'Trinidad and Tobago',
    alpha3: 'TTO',
  },
  TN: {
    name: 'Tunisia',
    alpha3: 'TUN',
  },
  TR: {
    name: 'Turkey',
    alpha3: 'TUR',
  },
  TM: {
    name: 'Turkmenistan',
    alpha3: 'TKM',
  },
  UG: {
    name: 'Uganda',
    alpha3: 'UGA',
  },
  UA: {
    name: 'Ukraine',
    alpha3: 'UKR',
  },
  AE: {
    name: 'United Arab Emirates',
    alpha3: 'ARE',
  },
  GB: {
    name: 'United Kingdom of Great Britain and Northern Ireland',
    alpha3: 'GBR',
  },
  US: {
    name: 'United States of America',
    alpha3: 'USA',

    regions: {
      'US-AK': {
        name: 'Alaska',
      },
      'US-AL': {
        name: 'Alabama',
      },
      'US-AZ': {
        name: 'Arizona',
      },
      'US-AR': {
        name: 'Arkansas',
      },
      'US-CA': {
        name: 'California',
      },
      'US-CO': {
        name: 'Colorado',
      },
      'US-CT': {
        name: 'Connecticut',
      },
      'US-DE': {
        name: 'Delaware',
      },
      'US-FL': {
        name: 'Florida',
      },
      'US-GA': {
        name: 'Georgia',
      },
      'US-HI': {
        name: 'Hawaii',
      },
      'US-ID': {
        name: 'Idaho',
      },
      'US-IL': {
        name: 'Illinois',
      },
      'US-IN': {
        name: 'Indiana',
      },
      'US-IA': {
        name: 'Iowa',
      },
      'US-KS': {
        name: 'Kansas',
      },
      'US-KY': {
        name: 'Kentucky',
      },
      'US-LA': {
        name: 'Louisiana',
      },
      'US-ME': {
        name: 'Maine',
      },
      'US-MD': {
        name: 'Maryland',
      },
      'US-MA': {
        name: 'Massachusetts',
      },
      'US-MI': {
        name: 'Michigan',
      },
      'US-MN': {
        name: 'Minnesota',
      },
      'US-MS': {
        name: 'Mississippi',
      },
      'US-MO': {
        name: 'Missouri',
      },
      'US-MT': {
        name: 'Montana',
      },
      'US-NE': {
        name: 'Nebraska',
      },
      'US-NV': {
        name: 'Nevada',
      },
      'US-NH': {
        name: 'New Hampshire',
      },
      'US-NJ': {
        name: 'New Jersey',
      },
      'US-NM': {
        name: 'New Mexico',
      },
      'US-NY': {
        name: 'New York',
      },
      'US-NC': {
        name: 'North Carolina',
      },
      'US-ND': {
        name: 'North Dakota',
      },
      'US-OH': {
        name: 'Ohio',
      },
      'US-OK': {
        name: 'Oklahoma',
      },
      'US-OR': {
        name: 'Oregon',
      },
      'US-PA': {
        name: 'Pennsylvania',
      },
      'US-RI': {
        name: 'Rhode Island',
      },
      'US-SC': {
        name: 'South Carolina',
      },
      'US-SD': {
        name: 'South Dakota',
      },
      'US-TN': {
        name: 'Tennessee',
      },
      'US-TX': {
        name: 'Texas',
      },
      'US-UT': {
        name: 'Utah',
      },
      'US-VT': {
        name: 'Vermont',
      },
      'US-VA': {
        name: 'Virginia',
      },
      'US-WA': {
        name: 'Washington',
      },
      'US-WV': {
        name: 'West Virginia',
      },
      'US-WI': {
        name: 'Wisconsin',
      },
      'US-WY': {
        name: 'Wyoming',
      },
      'US-DC': {
        name: 'District of Columbia',
      },
    },
  },
  UY: {
    name: 'Uruguay',
    alpha3: 'URY',
  },
  UZ: {
    name: 'Uzbekistan',
    alpha3: 'UZB',
  },
  VE: {
    name: 'Venezuela (Bolivarian Republic of)',
    alpha3: 'VEN',
  },
  VN: {
    name: 'Viet Nam',
    alpha3: 'VNM',
  },
  YE: {
    name: 'Yemen',
    alpha3: 'YEM',
  },
  ZM: {
    name: 'Zambia',
    alpha3: 'ZMB',
  },
  ZW: {
    name: 'Zimbabwe',
    alpha3: 'ZWE',
  },
}
