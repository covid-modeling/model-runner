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
   * The ISO 3166 code for the region
   *
   * This may be a 3166-1 or 3166-2 (subregion) dependeing on what level we're
   * at.
   */
  id: string

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
  GB: {
    name: 'Great Britain',
    id: 'GB',
    alpha3: 'GBR',
  },
  AT: {
    name: 'Austria',
    id: 'AT',
    alpha3: 'AUT',
  },
  AL: {
    name: 'Albania',
    id: 'AL',
    alpha3: 'ALB',
  },
  BY: {
    name: 'Belarus',
    id: 'BY',
    alpha3: 'BLR',
  },
  BE: {
    name: 'Belgium',
    id: 'BE',
    alpha3: 'BEL',
  },
  BA: {
    name: 'Bosnia and Herzegovina',
    id: 'BA',
    alpha3: 'BIH',
  },
  BG: {
    name: 'Bulgaria',
    id: 'BG',
    alpha3: 'BGR',
  },
  CA: {
    name: 'Canada',
    id: 'CA',
    alpha3: 'CAN',
  },
  HR: {
    name: 'Croatia',
    id: 'HR',
    alpha3: 'HRV',
  },
  CR: {
    name: 'Czechia',
    id: 'CR',
    alpha3: 'CZE',
  },
  DK: {
    name: 'Denmark',
    id: 'DK',
    alpha3: 'DNK',
  },
  EE: {
    name: 'Estonia',
    id: 'EE',
    alpha3: 'EST',
  },
  FI: {
    name: 'Finland',
    id: 'FI',
    alpha3: 'FIN',
  },
  FR: {
    name: 'France',
    id: 'FR',
    alpha3: 'FRA',
  },
  DE: {
    name: 'Germany',
    id: 'DE',
    alpha3: 'DEU',
  },
  GI: {
    name: 'Gibraltar',
    id: 'GI',
    alpha3: 'GIB',
  },
  GR: {
    name: 'Greece',
    id: 'GR',
    alpha3: 'GRC',
  },
  HU: {
    name: 'Hungary',
    id: 'HU',
    alpha3: 'HUN',
  },
  IS: {
    name: 'Iceland',
    id: 'IS',
    alpha3: 'ISL',
  },
  IR: {
    name: 'Ireland',
    id: 'IR',
    alpha3: 'IRL',
  },
  IT: {
    name: 'Italy',
    id: 'IT',
    alpha3: 'ITA',
  },
  LV: {
    name: 'Latvia',
    id: 'LV',
    alpha3: 'LVA',
  },
  LT: {
    name: 'Lithuania',
    id: 'LT',
    alpha3: 'LTU',
  },
  LU: {
    name: 'Luxembourg',
    id: 'LU',
    alpha3: 'LUX',
  },
  MK: {
    name: 'Macedonia',
    id: 'MK',
    alpha3: 'MKD',
  },
  MT: {
    name: 'Malta',
    id: 'MT',
    alpha3: 'MLT',
  },
  MD: {
    name: 'Moldova',
    id: 'MD',
    alpha3: 'MDA',
  },
  ME: {
    name: 'Montenegro',
    id: 'ME',
    alpha3: 'MNE',
  },
  NL: {
    name: 'Netherlands',
    id: 'NL',
    alpha3: 'NLD',
  },
  NO: {
    name: 'Norway',
    id: 'NO',
    alpha3: 'NOR',
  },
  PT: {
    name: 'Portugal',
    id: 'PT',
    alpha3: 'PRT',
  },
  PL: {
    name: 'Poland',
    id: 'PL',
    alpha3: 'POL',
  },
  RO: {
    name: 'Romania',
    id: 'RO',
    alpha3: 'ROU',
  },
  RU: {
    name: 'Russia',
    id: 'RU',
    alpha3: 'RUS',
  },
  RS: {
    name: 'Serbia',
    id: 'RS',
    alpha3: 'SRB',
  },
  SK: {
    name: 'Slovakia',
    id: 'SK',
    alpha3: 'SVK',
  },
  SI: {
    name: 'Slovenia',
    id: 'SI',
    alpha3: 'SVN',
  },
  ES: {
    name: 'Spain',
    id: 'ES',
    alpha3: 'ESP',
  },
  SE: {
    name: 'Sweden',
    id: 'SE',
    alpha3: 'SWE',
  },
  CH: {
    name: 'Switzerland',
    id: 'CH',
    alpha3: 'CHE',
  },
  UA: {
    name: 'Ukraine',
    id: 'UA',
    alpha3: 'UKR',
  },
  US: {
    name: 'United States of America',
    id: 'US',
    alpha3: 'USA',
    regions: {
      'US-AK': {
        id: 'US-AK',
        name: 'Alaska',
      },
      'US-AL': {
        id: 'US-AL',
        name: 'Alabama',
      },
      'US-AZ': {
        id: 'US-AZ',
        name: 'Arizona',
      },
      'US-AR': {
        id: 'US-AR',
        name: 'Arkansas',
      },
      'US-CA': {
        id: 'US-CA',
        name: 'California',
      },
      'US-CO': {
        id: 'US-CO',
        name: 'Colorado',
      },
      'US-CT': {
        id: 'US-CT',
        name: 'Connecticut',
      },
      'US-DE': {
        id: 'US-DE',
        name: 'Delaware',
      },
      'US-FL': {
        id: 'US-FL',
        name: 'Florida',
      },
      'US-GA': {
        id: 'US-GA',
        name: 'Georgia',
      },
      'US-HI': {
        id: 'US-HI',
        name: 'Hawaii',
      },
      'US-ID': {
        id: 'US-ID',
        name: 'Idaho',
      },
      'US-IL': {
        id: 'US-IL',
        name: 'Illinois',
      },
      'US-IN': {
        id: 'US-IN',
        name: 'Indiana',
      },
      'US-IA': {
        id: 'US-IA',
        name: 'Iowa',
      },
      'US-KS': {
        id: 'US-KS',
        name: 'Kansas',
      },
      'US-KY': {
        id: 'US-KY',
        name: 'Kentucky',
      },
      'US-LA': {
        id: 'US-LA',
        name: 'Louisiana',
      },
      'US-ME': {
        id: 'US-ME',
        name: 'Maine',
      },
      'US-MD': {
        id: 'US-MD',
        name: 'Maryland',
      },
      'US-MA': {
        id: 'US-MA',
        name: 'Massachusetts',
      },
      'US-MI': {
        id: 'US-MI',
        name: 'Michigan',
      },
      'US-MN': {
        id: 'US-MN',
        name: 'Minnesota',
      },
      'US-MS': {
        id: 'US-MS',
        name: 'Mississippi',
      },
      'US-MO': {
        id: 'US-MO',
        name: 'Missouri',
      },
      'US-MT': {
        id: 'US-MT',
        name: 'Montana',
      },
      'US-NE': {
        id: 'US-NE',
        name: 'Nebraska',
      },
      'US-NV': {
        id: 'US-NV',
        name: 'Nevada',
      },
      'US-NH': {
        id: 'US-NH',
        name: 'New Hampshire',
      },
      'US-NJ': {
        id: 'US-NJ',
        name: 'New Jersey',
      },
      'US-NM': {
        id: 'US-NM',
        name: 'New Mexico',
      },
      'US-NY': {
        id: 'US-NY',
        name: 'New York',
      },
      'US-NC': {
        id: 'US-NC',
        name: 'North Carolina',
      },
      'US-ND': {
        id: 'US-ND',
        name: 'North Dakota',
      },
      'US-OH': {
        id: 'US-OH',
        name: 'Ohio',
      },
      'US-OK': {
        id: 'US-OK',
        name: 'Oklahoma',
      },
      'US-OR': {
        id: 'US-OR',
        name: 'Oregon',
      },
      'US-PA': {
        id: 'US-PA',
        name: 'Pennsylvania',
      },
      'US-RI': {
        id: 'US-RI',
        name: 'Rhode Island',
      },
      'US-SC': {
        id: 'US-SC',
        name: 'South Carolina',
      },
      'US-SD': {
        id: 'US-SD',
        name: 'South Dakota',
      },
      'US-TN': {
        id: 'US-TN',
        name: 'Tennessee',
      },
      'US-TX': {
        id: 'US-TX',
        name: 'Texas',
      },
      'US-UT': {
        id: 'US-UT',
        name: 'Utah',
      },
      'US-VT': {
        id: 'US-VT',
        name: 'Vermont',
      },
      'US-VA': {
        id: 'US-VA',
        name: 'Virginia',
      },
      'US-WA': {
        id: 'US-WA',
        name: 'Washington',
      },
      'US-WV': {
        id: 'US-WV',
        name: 'West Virginia',
      },
      'US-WI': {
        id: 'US-WI',
        name: 'Wisconsin',
      },
      'US-WY': {
        id: 'US-WY',
        name: 'Wyoming',
      },
      'US-DC': {
        id: 'US-DC',
        name: 'District of Columbia',
      },
    },
  },
}
