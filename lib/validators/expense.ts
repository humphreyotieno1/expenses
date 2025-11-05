import { z } from "zod";

export type TransactionType = "INCOME" | "EXPENSE";

const transactionTypeValues = ["income", "expense", "INCOME", "EXPENSE"] as const;

const transactionTypeSchema = z
  .enum(transactionTypeValues)
  .transform((value) => value.toUpperCase() as TransactionType);

const baseExpenseSchema = z.object({
  title: z
    .string({ message: "Title is required." })
    .min(1, "Title is required.")
    .max(120, "Title must be 120 characters or less."),
  category: z
    .string({ message: "Category is required." })
    .min(1, "Category is required.")
    .max(60, "Category must be 60 characters or less."),
  type: transactionTypeSchema,
  amount: z
    .coerce
    .number({ message: "Amount must be a number." })
    .refine((value) => Number.isFinite(value), {
      message: "Amount must be a valid number.",
    })
    .refine((value) => value >= 0, {
      message: "Amount must be greater than or equal to 0.",
    }),
  date: z.coerce.date({ message: "Date is required." }),
  notes: z
    .string()
    .max(500, "Notes must be 500 characters or less.")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? undefined : value?.trim()))
    .optional(),
});

export const createExpenseSchema = baseExpenseSchema;

export const updateExpenseSchema = baseExpenseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

