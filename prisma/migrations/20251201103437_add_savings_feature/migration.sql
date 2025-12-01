-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'SAVINGS';

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "savingsLocation" TEXT;
