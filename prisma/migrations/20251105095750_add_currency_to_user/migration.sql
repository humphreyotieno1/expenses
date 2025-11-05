-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'KES', 'EUR', 'ZAR', 'JPY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'USD';
