-- Add salary percent fields per user
ALTER TABLE "User"
ADD COLUMN "barberPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "cosmeticsPercent" INTEGER NOT NULL DEFAULT 0;

-- Add service type for transactions
CREATE TYPE "ServiceType" AS ENUM ('BARBER', 'COSMETICS');

ALTER TABLE "Transaction"
ADD COLUMN "serviceType" "ServiceType" NOT NULL DEFAULT 'BARBER';
