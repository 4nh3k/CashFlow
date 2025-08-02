// VND (Vietnamese Dong) currency utilities

export const VND_CURRENCY = 'VND';
export const VND_SYMBOL = '₫';

// Format amount as VND currency string
export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: VND_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format amount as VND with symbol
export const formatVNDWithSymbol = (amount: number): string => {
  return `${formatVND(amount)}`;
};

// Parse VND amount from string (handles common Vietnamese formats)
export const parseVNDAmount = (input: string): number => {
  // Remove all non-numeric characters except decimal point
  const cleaned = input.replace(/[^\d.,]/g, '');
  
  // Handle Vietnamese number format (comma as decimal separator)
  const normalized = cleaned.replace(/\./g, '').replace(/,/g, '.');
  
  const amount = parseFloat(normalized);
  
  if (isNaN(amount)) {
    throw new Error('Invalid VND amount format');
  }
  
  return Math.round(amount); // VND doesn't use decimal places
};

// Parse common Vietnamese amount formats
export const parseVietnameseAmount = (input: string): number => {
  const lowerInput = input.toLowerCase().trim();
  
  // Handle "k" suffix (thousands)
  if (lowerInput.includes('k')) {
    const number = parseFloat(lowerInput.replace(/k/g, ''));
    return Math.round(number * 1000);
  }
  
  // Handle "nghìn" suffix (thousands)
  if (lowerInput.includes('nghìn')) {
    const number = parseFloat(lowerInput.replace(/nghìn/g, ''));
    return Math.round(number * 1000);
  }
  
  // Handle "triệu" suffix (millions)
  if (lowerInput.includes('triệu')) {
    const number = parseFloat(lowerInput.replace(/triệu/g, ''));
    return Math.round(number * 1000000);
  }
  
  // Handle "tỷ" suffix (billions)
  if (lowerInput.includes('tỷ')) {
    const number = parseFloat(lowerInput.replace(/tỷ/g, ''));
    return Math.round(number * 1000000000);
  }
  
  // Default parsing
  return parseVNDAmount(input);
};

// Validate VND amount
export const isValidVNDAmount = (amount: number): boolean => {
  return amount > 0 && Number.isInteger(amount) && Number.isFinite(amount);
};

// Convert amount to VND (assumes input is in VND)
export const toVND = (amount: number): number => {
  return Math.round(amount);
};

// Get VND amount display string
export const getVNDDisplay = (amount: number): string => {
  if (!isValidVNDAmount(amount)) {
    return 'Invalid amount';
  }
  
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)} tỷ ${VND_SYMBOL}`;
  } else if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)} triệu ${VND_SYMBOL}`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}k ${VND_SYMBOL}`;
  } else {
    return `${amount} ${VND_SYMBOL}`;
  }
};

// Currency conversion utilities (for future use)
export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
}

// Mock currency rates (in real app, this would come from an API)
export const DEFAULT_CURRENCY_RATES: CurrencyRate[] = [
  { from: 'USD', to: VND_CURRENCY, rate: 24000 },
  { from: 'EUR', to: VND_CURRENCY, rate: 26000 },
  { from: 'JPY', to: VND_CURRENCY, rate: 160 },
];

// Convert amount from one currency to VND
export const convertToVND = (amount: number, fromCurrency: string): number => {
  if (fromCurrency === VND_CURRENCY) {
    return amount;
  }
  
  const rate = DEFAULT_CURRENCY_RATES.find(r => r.from === fromCurrency && r.to === VND_CURRENCY);
  if (!rate) {
    throw new Error(`No conversion rate found for ${fromCurrency} to ${VND_CURRENCY}`);
  }
  
  return Math.round(amount * rate.rate);
};

// Convert amount from VND to another currency
export const convertFromVND = (amount: number, toCurrency: string): number => {
  if (toCurrency === VND_CURRENCY) {
    return amount;
  }
  
  const rate = DEFAULT_CURRENCY_RATES.find(r => r.from === toCurrency && r.to === VND_CURRENCY);
  if (!rate) {
    throw new Error(`No conversion rate found for ${VND_CURRENCY} to ${toCurrency}`);
  }
  
  return Math.round(amount / rate.rate);
}; 