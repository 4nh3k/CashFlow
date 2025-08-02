// Category-related type definitions for type safety

export interface Category {
  id: string;
  name: string;
  defaultType: 'expense' | 'income';
  color?: string; // Optional color for UI display
  icon?: string; // Optional icon identifier
  isDefault: boolean; // Whether this is a system default category
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryRequest {
  name: string;
  defaultType: 'expense' | 'income';
  color?: string;
  icon?: string;
}

export interface UpdateCategoryRequest {
  id: string;
  name?: string;
  defaultType?: 'expense' | 'income';
  color?: string;
  icon?: string;
  isDefault?: boolean;
}

// Type guards
export const isValidCategoryName = (name: unknown): name is string => {
  return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 50;
};

export const isCategoryType = (value: unknown): value is 'expense' | 'income' => {
  return typeof value === 'string' && ['expense', 'income'].includes(value);
}; 