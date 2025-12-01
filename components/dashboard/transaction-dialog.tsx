"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, Loader2, Check } from "lucide-react";
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
  FormDescription,
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

const transactionSchema = z.object({
  title: z.string().min(1, "Title is required."),
  amount: z
    .coerce
    .number()
    .refine((num) => Number.isFinite(num), "Amount must be valid.")
    .refine((num) => num >= 0, "Amount cannot be negative."),
  type: z.enum(["INCOME", "EXPENSE", "SAVINGS"] as const satisfies readonly TransactionType[]),
  category: z.string().min(1, "Category is required."),
  date: z.coerce.date(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters.")
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
  savingsLocation: z
    .string()
    .max(100, "Location must be 100 characters or less.")
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined)),
}).refine(
  (data) => data.type !== "SAVINGS" || data.savingsLocation,
  {
    message: "Savings location is required when type is SAVINGS.",
    path: ["savingsLocation"],
  }
);

export type TransactionFormValues = z.infer<typeof transactionSchema>;

type TransactionDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  expense?: Expense | null;
  categories: string[];
  defaultCategory?: string;
  onOpenChange: (open: boolean) => void;
};

export function TransactionDialog({ open, mode, expense, categories, defaultCategory = "Other", onOpenChange }: TransactionDialogProps) {
  const availableCategories = categories.length ? categories : ["Other"];
  const resolvedDefaultCategory = defaultCategory ?? availableCategories[0] ?? "Other";
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as Resolver<TransactionFormValues>,
    defaultValues: {
      title: "",
      amount: 0,
      type: "EXPENSE",
      category: resolvedDefaultCategory,
      date: new Date(),
      notes: "",
      savingsLocation: "",
    },
  });

  const createExpense = useExpenseStore((state) => state.createExpense);
  const updateExpense = useExpenseStore((state) => state.updateExpense);
  const fetchExpenses = useExpenseStore((state) => state.fetchExpenses);

  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (open) {
      setCategorySearch("");
      if (mode === "edit" && expense) {
        form.reset({
          title: expense.title,
          amount: expense.amount,
          type: expense.type,
          category: expense.category,
          date: new Date(expense.date),
          notes: expense.notes ?? "",
          savingsLocation: expense.savingsLocation ?? "",
        });
      } else if (mode === "create") {
        form.reset({
          title: "",
          amount: 0,
          type: "EXPENSE",
          category: resolvedDefaultCategory,
          date: new Date(),
          notes: "",
          savingsLocation: "",
        });
      }
    }
  }, [open, mode, expense, form, resolvedDefaultCategory]);

  const handleSubmit = async (values: TransactionFormValues) => {
    const payload = {
      title: values.title.trim(),
      amount: values.amount,
      type: values.type,
      category: values.category.trim(),
      date: values.date,
      notes: values.notes,
      savingsLocation: values.savingsLocation,
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
              ? "Capture a new income, expense, or savings entry."
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
                          <SelectItem value="SAVINGS">Savings</SelectItem>
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
                render={({ field }) => {
                  const filteredCategories = availableCategories.filter((cat) =>
                    cat.toLowerCase().includes(categorySearch.toLowerCase())
                  );
                  const showCreateOption = categorySearch && !availableCategories.includes(categorySearch);

                  return (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isSubmitting}
                            >
                              {field.value || "Select or type a category..."}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                            <div className="flex flex-col">
                              <Input
                                placeholder="Search or type new category..."
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                className="m-2"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && categorySearch) {
                                    field.onChange(categorySearch);
                                    setCategorySearch("");
                                    setIsCategoryPopoverOpen(false);
                                  }
                                }}
                              />
                              <div className="max-h-[200px] overflow-y-auto overscroll-contain p-1">
                                {filteredCategories.length > 0 ? (
                                  filteredCategories.map((category) => (
                                    <button
                                      key={category}
                                      type="button"
                                      className={cn(
                                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                                        field.value === category && "bg-accent"
                                      )}
                                      onClick={() => {
                                        field.onChange(category);
                                        setCategorySearch("");
                                        setIsCategoryPopoverOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "h-4 w-4",
                                          field.value === category ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {category}
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">
                                    No categories found
                                  </div>
                                )}
                                {showCreateOption && (
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm font-medium text-primary hover:bg-accent"
                                    onClick={() => {
                                      field.onChange(categorySearch);
                                      setCategorySearch("");
                                      setIsCategoryPopoverOpen(false);
                                    }}
                                  >
                                    <span>Create &quot;{categorySearch}&quot;</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormDescription>
                        Choose an existing category or type a new label to create one.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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

            {form.watch("type") === "SAVINGS" && (
              <FormField
                control={form.control}
                name="savingsLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Savings Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Bank Account, Investment Fund, Emergency Savings"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Where are you putting this savings?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

