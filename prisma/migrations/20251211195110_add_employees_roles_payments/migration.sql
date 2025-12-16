-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Create Employee table
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Payment table
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT,
    "userId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "loyaltyPointsUsed" INTEGER,
    "discountApplied" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create CashRegister table
CREATE TABLE "CashRegister" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL UNIQUE,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "totalTransactions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Update User table - add role column
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "inviteCode" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "loyaltyTier" TEXT NOT NULL DEFAULT 'Bronze',
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Copy data and set role based on isAdmin
INSERT INTO "new_User" ("id", "name", "email", "password", "inviteCode", "loyaltyPoints", "loyaltyTier", "totalVisits", "totalSpent", "createdAt", "role")
SELECT 
    "id", 
    "name", 
    "email", 
    "password", 
    "inviteCode", 
    "loyaltyPoints", 
    "loyaltyTier", 
    "totalVisits", 
    "totalSpent", 
    "createdAt",
    CASE 
        WHEN "email" = 'irena@beautylab.hr' THEN 'OWNER'
        WHEN "isAdmin" = 1 THEN 'ADMIN'
        ELSE 'CLIENT'
    END as "role"
FROM "User";

DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

-- Update Appointment table - add assignedEmployeeId
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "service" TEXT NOT NULL,
    "userId" TEXT,
    "assignedEmployeeId" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "pointsEarned" INTEGER,
    "unregisteredName" TEXT,
    "unregisteredPhone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Appointment" ("id", "date", "service", "userId", "isCompleted", "pointsEarned", "unregisteredName", "unregisteredPhone", "createdAt")
SELECT "id", "date", "service", "userId", "isCompleted", "pointsEarned", "unregisteredName", "unregisteredPhone", "createdAt" FROM "Appointment";

DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";

-- Update Settings table - add pointsPerCurrencyUnit
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailNewAppointments" BOOLEAN NOT NULL DEFAULT true,
    "emailNewUsers" BOOLEAN NOT NULL DEFAULT true,
    "emailIncompleteAppointments" BOOLEAN NOT NULL DEFAULT true,
    "emailDailySummary" BOOLEAN NOT NULL DEFAULT false,
    "notificationEmail" TEXT NOT NULL DEFAULT 'irena@beautylab.hr',
    "workingDays" TEXT NOT NULL DEFAULT '["monday","tuesday","wednesday","thursday","friday"]',
    "workingHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '18:00',
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "holidays" TEXT,
    "defaultPointsPerService" INTEGER NOT NULL DEFAULT 10,
    "bronzeThreshold" INTEGER NOT NULL DEFAULT 0,
    "silverThreshold" INTEGER NOT NULL DEFAULT 100,
    "goldThreshold" INTEGER NOT NULL DEFAULT 300,
    "platinumThreshold" INTEGER NOT NULL DEFAULT 500,
    "inviteCodeBonusPoints" INTEGER NOT NULL DEFAULT 15,
    "autoUpdateTiers" BOOLEAN NOT NULL DEFAULT true,
    "pointsPerCurrencyUnit" REAL NOT NULL DEFAULT 1.0,
    "notificationRefreshInterval" INTEGER NOT NULL DEFAULT 30,
    "showNewAppointmentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "showTodayAppointmentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "showNewUserNotifications" BOOLEAN NOT NULL DEFAULT true,
    "showIncompleteNotifications" BOOLEAN NOT NULL DEFAULT true,
    "notificationSoundEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoCompleteAppointments" BOOLEAN NOT NULL DEFAULT false,
    "autoCompleteAfterHours" INTEGER,
    "autoDeleteOldAppointments" BOOLEAN NOT NULL DEFAULT false,
    "autoDeleteAfterDays" INTEGER,
    "autoSendReminderEmails" BOOLEAN NOT NULL DEFAULT false,
    "reminderEmailHoursBefore" INTEGER,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'hr',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD.MM.YYYY',
    "timeFormat" TEXT NOT NULL DEFAULT '24h',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Zagreb',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_Settings" (
    "id", "emailNotificationsEnabled", "emailNewAppointments", "emailNewUsers", 
    "emailIncompleteAppointments", "emailDailySummary", "notificationEmail",
    "workingDays", "workingHoursStart", "workingHoursEnd", "breakStart", "breakEnd", "holidays",
    "defaultPointsPerService", "bronzeThreshold", "silverThreshold", "goldThreshold", 
    "platinumThreshold", "inviteCodeBonusPoints", "autoUpdateTiers", "pointsPerCurrencyUnit",
    "notificationRefreshInterval", "showNewAppointmentNotifications", "showTodayAppointmentNotifications",
    "showNewUserNotifications", "showIncompleteNotifications", "notificationSoundEnabled",
    "autoCompleteAppointments", "autoCompleteAfterHours", "autoDeleteOldAppointments", 
    "autoDeleteAfterDays", "autoSendReminderEmails", "reminderEmailHoursBefore",
    "theme", "language", "dateFormat", "timeFormat", "timezone", "createdAt", "updatedAt"
)
SELECT 
    "id", "emailNotificationsEnabled", "emailNewAppointments", "emailNewUsers", 
    "emailIncompleteAppointments", "emailDailySummary", "notificationEmail",
    "workingDays", "workingHoursStart", "workingHoursEnd", "breakStart", "breakEnd", "holidays",
    "defaultPointsPerService", "bronzeThreshold", "silverThreshold", "goldThreshold", 
    "platinumThreshold", "inviteCodeBonusPoints", "autoUpdateTiers", 1.0 as "pointsPerCurrencyUnit",
    "notificationRefreshInterval", "showNewAppointmentNotifications", "showTodayAppointmentNotifications",
    "showNewUserNotifications", "showIncompleteNotifications", "notificationSoundEnabled",
    "autoCompleteAppointments", "autoCompleteAfterHours", "autoDeleteOldAppointments", 
    "autoDeleteAfterDays", "autoSendReminderEmails", "reminderEmailHoursBefore",
    "theme", "language", "dateFormat", "timeFormat", "timezone", "createdAt", "updatedAt"
FROM "Settings";

DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

