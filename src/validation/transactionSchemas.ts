import { z } from 'zod';

// Base schemas for common fields
export const idSchema = z.string().min(1, 'ID is required');
export const amountSchema = z.number()
  .positive('Amount must be positive')
  .int('Amount must be a whole number (VND does not use decimals)')
  .min(1, 'Amount must be at least 1 VND');
export const dateSchema = z.date();
export const descriptionSchema = z.string()
  .min(1, 'Description is required')
  .max(500, 'Description too long')
  .refine((val) => {
    // Validate UTF-8 encoding
    try {
      const encoded = new TextEncoder().encode(val);
      const decoded = new TextDecoder('utf-8').decode(encoded);
      return decoded === val;
    } catch {
      return false;
    }
  }, 'Description contains invalid UTF-8 characters');
export const transactionTypeSchema = z.enum(['expense', 'income']);
export const transactionStatusSchema = z.enum(['pending', 'completed', 'cancelled']);

// Transaction schemas
export const createTransactionSchema = z.object({
  amount: amountSchema,
  date: dateSchema,
  description: descriptionSchema,
  categoryId: idSchema,
  walletId: idSchema,
  type: transactionTypeSchema
});

export const updateTransactionSchema = z.object({
  id: idSchema,
  amount: amountSchema.optional(),
  date: dateSchema.optional(),
  description: descriptionSchema.optional(),
  categoryId: idSchema.optional(),
  walletId: idSchema.optional(),
  type: transactionTypeSchema.optional(),
  status: transactionStatusSchema.optional()
});

export const transactionSchema = z.object({
  id: idSchema,
  amount: amountSchema,
  date: dateSchema,
  description: descriptionSchema,
  categoryId: idSchema,
  walletId: idSchema,
  type: transactionTypeSchema,
  status: transactionStatusSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema
});

// Filter and sort schemas
export const transactionFiltersSchema = z.object({
  type: transactionTypeSchema.optional(),
  categoryId: idSchema.optional(),
  walletId: idSchema.optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  status: transactionStatusSchema.optional()
});

export const transactionSortFieldSchema = z.enum(['date', 'amount', 'description', 'createdAt']);
export const sortDirectionSchema = z.enum(['asc', 'desc']);

export const transactionSortOptionsSchema = z.object({
  field: transactionSortFieldSchema,
  direction: sortDirectionSchema
});

// Form data schema (for form inputs)
export const transactionFormDataSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be a positive number'
  ),
  date: z.string().min(1, 'Date is required').refine(
    (val) => !isNaN(Date.parse(val)),
    'Invalid date format'
  ),
  description: descriptionSchema,
  categoryId: idSchema,
  walletId: idSchema,
  type: transactionTypeSchema
});

// Type exports
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransactionFiltersInput = z.infer<typeof transactionFiltersSchema>;
export type TransactionSortOptionsInput = z.infer<typeof transactionSortOptionsSchema>;
export type TransactionFormDataInput = z.infer<typeof transactionFormDataSchema>;

// Validation functions
export const validateCreateTransaction = (data: unknown): CreateTransactionInput => {
  return createTransactionSchema.parse(data);
};

export const validateUpdateTransaction = (data: unknown): UpdateTransactionInput => {
  return updateTransactionSchema.parse(data);
};

export const validateTransaction = (data: unknown): TransactionInput => {
  return transactionSchema.parse(data);
};

export const validateTransactionFilters = (data: unknown): TransactionFiltersInput => {
  return transactionFiltersSchema.parse(data);
};

export const validateTransactionSortOptions = (data: unknown): TransactionSortOptionsInput => {
  return transactionSortOptionsSchema.parse(data);
};

export const validateTransactionFormData = (data: unknown): TransactionFormDataInput => {
  return transactionFormDataSchema.parse(data);
};

// Safe validation functions (return validation result instead of throwing)
export const safeValidateCreateTransaction = (data: unknown) => {
  return createTransactionSchema.safeParse(data);
};

export const safeValidateUpdateTransaction = (data: unknown) => {
  return updateTransactionSchema.safeParse(data);
};

export const safeValidateTransaction = (data: unknown) => {
  return transactionSchema.safeParse(data);
};

export const safeValidateTransactionFilters = (data: unknown) => {
  return transactionFiltersSchema.safeParse(data);
};

export const safeValidateTransactionSortOptions = (data: unknown) => {
  return transactionSortOptionsSchema.safeParse(data);
};

export const safeValidateTransactionFormData = (data: unknown) => {
  return transactionFormDataSchema.safeParse(data);
}; 