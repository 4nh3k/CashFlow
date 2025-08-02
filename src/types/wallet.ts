// Wallet-related type definitions for type safety

export interface Wallet {
  id: string;
  name: string;
  balance: number; // Current balance in VND
  currency: string; // Default: 'VND'
  isDefault: boolean; // Whether this is the default wallet
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWalletRequest {
  name: string;
  balance: number;
  currency?: string;
  isDefault?: boolean;
}

export interface UpdateWalletRequest {
  id: string;
  name?: string;
  balance?: number;
  currency?: string;
  isDefault?: boolean;
}

export interface WalletBalanceUpdate {
  walletId: string;
  amount: number; // Positive for income, negative for expense
  transactionId: string;
}

// Type guards
export const isValidWalletName = (name: unknown): name is string => {
  return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 50;
};

export const isValidBalance = (balance: unknown): balance is number => {
  return typeof balance === 'number' && Number.isFinite(balance) && balance >= 0;
};

export const isValidCurrency = (currency: unknown): currency is string => {
  return typeof currency === 'string' && currency.length === 3;
}; 