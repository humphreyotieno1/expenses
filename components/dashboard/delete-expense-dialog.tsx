"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
import { useExpenseStore, type Expense } from "@/store/expense-store";

type DeleteExpenseDialogProps = {
  expense: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteExpenseDialog({ expense, open, onOpenChange }: DeleteExpenseDialogProps) {
  const deleteExpense = useExpenseStore((state) => state.deleteExpense);
  const fetchExpenses = useExpenseStore((state) => state.fetchExpenses);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!expense) return;
    setIsDeleting(true);
    const success = await deleteExpense(expense.id);

    if (!success) {
      toast.error("Unable to delete", { description: "Something went wrong deleting this transaction." });
      setIsDeleting(false);
      return;
    }

    toast.success("Transaction deleted");
    onOpenChange(false);
    setIsDeleting(false);
    await fetchExpenses();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete transaction</DialogTitle>
          <DialogDescription>
            This action cannot be undone. The transaction &quot;{expense?.title}&quot; will be permanently removed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

