-- Expense categories + direct salary user reference + app settings
CREATE TYPE "ExpenseCategory" AS ENUM ('SALARY', 'RENT', 'UTILITIES', 'OTHER');

ALTER TABLE "Expense"
ADD COLUMN "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN "salaryUserId" INTEGER;

ALTER TABLE "Expense"
ADD CONSTRAINT "Expense_salaryUserId_fkey"
FOREIGN KEY ("salaryUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "AppSetting" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- Migrate legacy tagged comments to explicit columns
UPDATE "Expense"
SET "category" = 'SALARY'
WHERE COALESCE("comment", '') ~* '\\[CAT:SALARY\\]'
   OR COALESCE("comment", '') ~* '(зарплат|salary|зп|виплат)';

UPDATE "Expense"
SET "category" = 'RENT'
WHERE COALESCE("comment", '') ~* '(оренд|rent)';

UPDATE "Expense"
SET "category" = 'UTILITIES'
WHERE COALESCE("comment", '') ~* '(комунал|utility|utilities)';

UPDATE "Expense"
SET "salaryUserId" = NULLIF(SUBSTRING(COALESCE("comment", '') FROM '\\[USER:([0-9]+)\\]'), '')::INTEGER
WHERE COALESCE("comment", '') ~* '\\[USER:[0-9]+\\]';

UPDATE "Expense"
SET "comment" = NULLIF(
  BTRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(COALESCE("comment", ''), '\\[CAT:[A-Z_]+\\]\\s*', '', 'gi'),
      '\\[USER:[0-9]+\\]\\s*', '', 'gi'
    )
  ),
  ''
);
