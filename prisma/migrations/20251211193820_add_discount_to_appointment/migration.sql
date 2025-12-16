-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "discountApplied" REAL DEFAULT 0;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "loyaltyPointsUsed" INTEGER DEFAULT 0,
    "discountApplied" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "appointmentId", "createdAt", "discountApplied", "id", "loyaltyPointsUsed", "paymentMethod", "userId") SELECT "amount", "appointmentId", "createdAt", "discountApplied", "id", "loyaltyPointsUsed", "paymentMethod", "userId" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- RedefineIndex
DROP INDEX "sqlite_autoindex_CashRegister_2";
CREATE UNIQUE INDEX "CashRegister_date_key" ON "CashRegister"("date");

-- RedefineIndex
DROP INDEX "sqlite_autoindex_Employee_2";
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- RedefineIndex
DROP INDEX "sqlite_autoindex_User_2";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
