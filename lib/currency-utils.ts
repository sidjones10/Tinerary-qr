/**
 * Currency utilities for conversion and formatting
 */

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
};

export const CURRENCY_NAMES: Record<Currency, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
};

// Exchange rates relative to USD (1 USD = X currency)
// These are approximate rates and should ideally be fetched from an API for real-time rates
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CAD: 1.36,
  AUD: 1.52,
};

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to USD first, then to target currency
  const amountInUSD = amount / EXCHANGE_RATES[fromCurrency];
  const convertedAmount = amountInUSD * EXCHANGE_RATES[toCurrency];

  return convertedAmount;
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(
  amount: number,
  currency: Currency,
  options: {
    showSymbol?: boolean;
    showCode?: boolean;
    decimals?: number;
  } = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    decimals = currency === 'JPY' ? 0 : 2,
  } = options;

  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const symbol = showSymbol ? CURRENCY_SYMBOLS[currency] : '';
  const code = showCode ? ` ${currency}` : '';

  return `${symbol}${formattedAmount}${code}`;
}

/**
 * Format amount with dual currency display
 * Shows both original and converted currency
 */
export function formatDualCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  options: {
    showBothCodes?: boolean;
  } = {}
): string {
  const { showBothCodes = true } = options;

  if (fromCurrency === toCurrency) {
    return formatCurrency(amount, fromCurrency, { showCode: showBothCodes });
  }

  const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);

  const original = formatCurrency(amount, fromCurrency, { showCode: showBothCodes });
  const converted = formatCurrency(convertedAmount, toCurrency, { showCode: showBothCodes });

  return `${original} (${converted})`;
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] || '$';
}

/**
 * Check if two currencies are different
 */
export function isDifferentCurrency(currency1: Currency, currency2: Currency): boolean {
  return currency1 !== currency2;
}
