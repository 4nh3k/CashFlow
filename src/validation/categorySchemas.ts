import { z } from 'zod';

// Base category type schema
export const CategoryTypeSchema = z.enum(['expense', 'income'], {
  message: 'Type must be either "expense" or "income"'
});

// Category name validation with UTF-8 support and case-insensitive uniqueness
export const CategoryNameSchema = z
  .string()
  .min(1, 'Category name is required')
  .max(50, 'Category name must not exceed 50 characters')
  .trim()
  .refine((name) => {
    // Check for valid UTF-8 characters (supports Vietnamese and other languages)
    try {
      // Test if the string can be properly encoded/decoded
      const encoded = encodeURIComponent(name);
      const decoded = decodeURIComponent(encoded);
      return decoded === name;
    } catch {
      return false;
    }
  }, {
    message: 'Category name contains invalid characters'
  });

// Color validation (optional hex color)
export const ColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color (e.g., #FF0000 or #F00)')
  .optional();

// Icon validation (optional string identifier)
export const IconSchema = z
  .string()
  .min(1, 'Icon identifier cannot be empty')
  .max(20, 'Icon identifier must not exceed 20 characters')
  .optional();

// MongoDB ObjectId validation
export const ObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// Category schema for creation
export const CreateCategorySchema = z.object({
  name: CategoryNameSchema,
  defaultType: CategoryTypeSchema,
  color: ColorSchema,
  icon: IconSchema,
});

// Category schema for updates
export const UpdateCategorySchema = z.object({
  id: ObjectIdSchema,
  name: CategoryNameSchema.optional(),
  defaultType: CategoryTypeSchema.optional(),
  color: ColorSchema,
  icon: IconSchema,
});

// Full category schema (for database/API responses)
export const CategorySchema = z.object({
  _id: ObjectIdSchema,
  name: CategoryNameSchema,
  defaultType: CategoryTypeSchema,
  color: ColorSchema,
  icon: IconSchema,
  isDefault: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Category array schema
export const CategoriesArraySchema = z.array(CategorySchema);

// Query schemas for filtering/searching
export const CategoryQuerySchema = z.object({
  type: CategoryTypeSchema.optional(),
  search: z.string().max(50).optional(),
  includeDefaults: z.boolean().default(true),
});

// Schema for category name uniqueness validation
export const CategoryNameUniquenessSchema = z.object({
  name: CategoryNameSchema,
  excludeId: ObjectIdSchema.optional(), // For updates, exclude current category
});

// Export types
export type CreateCategoryData = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryData = z.infer<typeof UpdateCategorySchema>;
export type CategoryData = z.infer<typeof CategorySchema>;
export type CategoryQuery = z.infer<typeof CategoryQuerySchema>;
export type CategoryNameUniqueness = z.infer<typeof CategoryNameUniquenessSchema>;
