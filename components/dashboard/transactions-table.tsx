"use client";

import { format } from "date-fns";
import { Edit2, Trash2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Expense } from "@/store/expense-store";

type TransactionsTableProps = {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  formatAmount: (amount: number, type: Expense["type"]) => string;
};

export function TransactionsTable({ expenses, onEdit, onDelete, formatAmount }: TransactionsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                No transactions found. Add your first income or expense to get started.
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="whitespace-nowrap text-sm">
                  {format(new Date(expense.date), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="font-medium">{expense.title}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{expense.category}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={expense.type === "INCOME" ? "default" : "destructive"}>
                    {expense.type === "INCOME" ? "Income" : "Expense"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatAmount(expense.amount, expense.type)}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button variant="outline" size="icon" onClick={() => onEdit(expense)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => onDelete(expense)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

