/** Map of common country names to ISO 3166-1 alpha-2 codes */
const COUNTRY_CODES: Record<string, string> = {
  'afghanistan': 'AF', 'albania': 'AL', 'algeria': 'DZ', 'argentina': 'AR',
  'australia': 'AU', 'austria': 'AT', 'bahrain': 'BH', 'bangladesh': 'BD',
  'belgium': 'BE', 'brazil': 'BR', 'bulgaria': 'BG', 'cambodia': 'KH',
  'canada': 'CA', 'chile': 'CL', 'china': 'CN', 'colombia': 'CO',
  'costa rica': 'CR', 'croatia': 'HR', 'cyprus': 'CY', 'czech republic': 'CZ',
  'czechia': 'CZ', 'denmark': 'DK', 'ecuador': 'EC', 'egypt': 'EG',
  'estonia': 'EE', 'ethiopia': 'ET', 'finland': 'FI', 'france': 'FR',
  'germany': 'DE', 'ghana': 'GH', 'greece': 'GR', 'hong kong': 'HK',
  'hungary': 'HU', 'iceland': 'IS', 'india': 'IN', 'indonesia': 'ID',
  'ireland': 'IE', 'israel': 'IL', 'italy': 'IT', 'japan': 'JP',
  'jordan': 'JO', 'kenya': 'KE', 'kuwait': 'KW', 'latvia': 'LV',
  'lebanon': 'LB', 'lithuania': 'LT', 'luxembourg': 'LU', 'malaysia': 'MY',
  'maldives': 'MV', 'malta': 'MT', 'mauritius': 'MU', 'mexico': 'MX',
  'morocco': 'MA', 'myanmar': 'MM', 'nepal': 'NP', 'netherlands': 'NL',
  'new zealand': 'NZ', 'nigeria': 'NG', 'norway': 'NO', 'oman': 'OM',
  'pakistan': 'PK', 'panama': 'PA', 'peru': 'PE', 'philippines': 'PH',
  'poland': 'PL', 'portugal': 'PT', 'qatar': 'QA', 'romania': 'RO',
  'russia': 'RU', 'saudi arabia': 'SA', 'senegal': 'SN', 'serbia': 'RS',
  'singapore': 'SG', 'slovakia': 'SK', 'slovenia': 'SI', 'south africa': 'ZA',
  'south korea': 'KR', 'spain': 'ES', 'sri lanka': 'LK', 'sweden': 'SE',
  'switzerland': 'CH', 'taiwan': 'TW', 'tanzania': 'TZ', 'thailand': 'TH',
  'turkey': 'TR', 'turkiye': 'TR', 'uganda': 'UG', 'ukraine': 'UA',
  'united arab emirates': 'AE', 'uae': 'AE', 'united kingdom': 'GB', 'uk': 'GB',
  'united states': 'US', 'usa': 'US', 'uruguay': 'UY', 'uzbekistan': 'UZ',
  'vietnam': 'VN', 'zambia': 'ZM', 'zimbabwe': 'ZW',
};

export function getCountryCode(country: string): string | null {
  return COUNTRY_CODES[country.toLowerCase().trim()] ?? null;
}

/** Reverse lookup: ISO 2-letter code → country name */
const CODE_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_CODES).map(([name, code]) => [code.toUpperCase(), name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')])
);
// Fix common casing
CODE_TO_NAME['US'] = 'United States';
CODE_TO_NAME['GB'] = 'United Kingdom';
CODE_TO_NAME['AE'] = 'United Arab Emirates';
CODE_TO_NAME['NZ'] = 'New Zealand';
CODE_TO_NAME['ZA'] = 'South Africa';
CODE_TO_NAME['KR'] = 'South Korea';
CODE_TO_NAME['HK'] = 'Hong Kong';
CODE_TO_NAME['CR'] = 'Costa Rica';
CODE_TO_NAME['LK'] = 'Sri Lanka';
CODE_TO_NAME['SA'] = 'Saudi Arabia';

export function getCountryName(isoCode: string): string | null {
  return CODE_TO_NAME[isoCode.toUpperCase()] ?? null;
}

/** Returns a flag CDN URL for the given country name, or null if not found */
export function getFlagUrl(country: string, size: 'w20' | 'w40' | 'w80' = 'w40'): string | null {
  const code = getCountryCode(country);
  if (!code) return null;
  return `https://flagcdn.com/${size}/${code.toLowerCase()}.png`;
}

/** Returns a logo URL from the company website domain via Google's favicon API */
export function getCompanyLogoUrl(companyWebsite: string | null): string | null {
  if (!companyWebsite) return null;
  try {
    const domain = new URL(companyWebsite).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
}
