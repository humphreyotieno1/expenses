"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useExpenseStore, type Expense } from "@/store/expense-store";
import { type TransactionType } from "@/lib/validators/expense";

const categories = [
  "Food",
  "Rent",
  "Utilities",
  "Transport",
  "Entertainment",
  "Healthcare",
  "Education",
  "Savings",
  "Shopping",
  "Travel",
  "Other",
];

const transactionSchema = z.object({
  title: z.string().min(1, "Title is required."),
  amount: z
    .coerce
    .number()
    .refine((num) => Number.isFinite(num), "Amount must be valid.")
    .refine((num) => num >= 0, "Amount cannot be negative."),
  type: z.enum(["INCOME", "EXPENSE"] as const satisfies readonly TransactionType[]),
  category: z.string().min(1, "Category is required."),
  date: z.coerce.date(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters.")
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

type TransactionDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  expense?: Expense | null;
  onOpenChange: (open: boolean) => void;
};

export function TransactionDialog({ open, mode, expense, onOpenChange }: TransactionDialogProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as Resolver<TransactionFormValues>,
    defaultValues: {
      title: "",
      amount: 0,
      type: "EXPENSE",
      category: "Other",
      date: new Date(),
      notes: "",
    },
  });

  const createExpense = useExpenseStore((state) => state.createExpense);
  const updateExpense = useExpenseStore((state) => state.updateExpense);
  const fetchExpenses = useExpenseStore((state) => state.fetchExpenses);
  const filters = useExpenseStore((state) => state.filters);

  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (open) {
      if (mode === "edit" && expense) {
        form.reset({
          title: expense.title,
          amount: expense.amount,
          type: expense.type,
          category: expense.category,
          date: new Date(expense.date),
          notes: expense.notes ?? "",
        });
      } else if (mode === "create") {
        form.reset({
          title: "",
          amount: 0,
          type: "EXPENSE",
          category: filters.category ?? "Other",
          date: new Date(),
          notes: "",
        });
      }
    }
  }, [open, mode, expense, form, filters.category]);

  const handleSubmit = async (values: TransactionFormValues) => {
    const payload = {
      title: values.title.trim(),
      amount: values.amount,
      type: values.type,
      category: values.category.trim(),
      date: values.date,
      notes: values.notes,
    };

    const action = mode === "create"
      ? await createExpense(payload)
      : expense
        ? await updateExpense(expense.id, payload)
        : null;

    if (!action) {
      toast.error("Something went wrong", {
        description: "We couldn't save that transaction. Please try again.",
      });
      return;
    }

    toast.success(mode === "create" ? "Transaction added" : "Transaction updated");
    onOpenChange(false);
    await fetchExpenses();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add transaction" : "Edit transaction"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Capture a new income or expense entry."
              : "Update the details for this transaction."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Groceries"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        disabled={isSubmitting}
                        {...field}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INCOME">Income</SelectItem>
                          <SelectItem value="EXPENSE">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select
                        disabled={isSubmitting}
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            disabled={isSubmitting}
                            className={cn(
                              "justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Select date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-70" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => date && field.onChange(date)}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional details"
                      disabled={isSubmitting}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : mode === "create" ? (
                  "Save transaction"
                ) : (
                  "Update transaction"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

