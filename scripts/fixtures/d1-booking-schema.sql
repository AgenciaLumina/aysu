-- Isolated schema only. No customer data.
CREATE TABLE "AuditLog" (
    id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changedFields" TEXT,
    "userId" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);
CREATE TABLE "Cabin" (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    "pricePerHour" REAL NOT NULL,
    description TEXT,
    "imageUrl" TEXT,
    category TEXT DEFAULT 'CABANA' NOT NULL,
    "isActive" INTEGER DEFAULT 1 NOT NULL,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    slug TEXT,
    units INTEGER DEFAULT 1 NOT NULL,
    "visibilityStatus" TEXT DEFAULT 'AVAILABLE' NOT NULL,
    "deletedAt" DATETIME,
    "deletedOriginalName" TEXT,
    "deletedVisibilityStatus" TEXT,
    PRIMARY KEY ("id")
);
CREATE TABLE "ClosedDate" (
    id TEXT NOT NULL,
    date date NOT NULL,
    reason TEXT DEFAULT 'Evento Fechado' NOT NULL,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);
CREATE TABLE "Event" (
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    "fullDescription" TEXT,
    "eventType" TEXT DEFAULT 'OTHER' NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "bannerImageUrl" TEXT,
    "posterImageUrl" TEXT,
    "galleryImages" TEXT,
    "djName" TEXT,
    bands TEXT,
    "specialDrinks" TEXT,
    "specialFood" TEXT,
    "themeColor" TEXT,
    "isActive" INTEGER DEFAULT 1 NOT NULL,
    "isFeatured" INTEGER DEFAULT 0 NOT NULL,
    "maxCapacity" INTEGER,
    "ticketPrice" REAL,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "spacePricesOverrides" TEXT,
    PRIMARY KEY ("id")
);
CREATE TABLE "EventGallery" (
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    "eventDate" date,
    "shortDescription" TEXT,
    description TEXT,
    "coverImageUrl" TEXT,
    "ctaText" TEXT,
    "ctaHref" TEXT,
    "isActive" INTEGER DEFAULT 1 NOT NULL,
    "displayOrder" INTEGER DEFAULT 0 NOT NULL,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);
CREATE TABLE "EventGalleryPhoto" (
    id TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    caption TEXT,
    "displayOrder" INTEGER DEFAULT 0 NOT NULL,
    "isActive" INTEGER DEFAULT 1 NOT NULL,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);
CREATE TABLE "GalleryImage" (
    id TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    caption TEXT,
    permalink TEXT,
    "displayOrder" INTEGER DEFAULT 0 NOT NULL,
    "isActive" INTEGER DEFAULT 1 NOT NULL,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    PRIMARY KEY ("id")
);
CREATE TABLE "MenuCategory" (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    "displayOrder" INTEGER DEFAULT 0 NOT NULL,
    "isActive" INTEGER DEFAULT 1 NOT NULL,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    PRIMARY KEY ("id")
);
CREATE TABLE "MenuGalleryImage" (
    id TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    caption TEXT,
    "displayOrder" INTEGER DEFAULT 0 NOT NULL,
    "isActive" INTEGER DEFAULT 1 NOT NULL,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    PRIMARY KEY ("id")
);
CREATE TABLE "MenuItem" (
    id TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    ingredients TEXT,
    price REAL NOT NULL,
    "imageUrl" TEXT,
    "isAvailable" INTEGER DEFAULT 1 NOT NULL,
    "preparationTime" INTEGER,
    "allergyInfo" TEXT,
    "displayOrder" INTEGER DEFAULT 0 NOT NULL,
    tags TEXT,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    PRIMARY KEY ("id")
);
CREATE TABLE "PDVOrder" (
    id TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING' NOT NULL,
    "totalPrice" REAL NOT NULL,
    discount REAL DEFAULT 0 NOT NULL,
    notes TEXT,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    PRIMARY KEY ("id")
);
CREATE TABLE "PDVOrderItem" (
    id TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalPrice" REAL NOT NULL,
    "specialInstructions" TEXT,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);
CREATE TABLE "Payment" (
    id TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'BRL' NOT NULL,
    status TEXT DEFAULT 'PENDING' NOT NULL,
    "redeTransactionId" TEXT,
    "redeNsu" TEXT,
    "redeAuthCode" TEXT,
    "cardBrand" TEXT,
    "cardLastFour" TEXT,
    installments INTEGER DEFAULT 1 NOT NULL,
    "webhookReceived" INTEGER DEFAULT 0 NOT NULL,
    "webhookData" TEXT,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    PRIMARY KEY ("id")
);
CREATE TABLE "Reservation" (
    id TEXT NOT NULL,
    "cabinId" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerDocument" TEXT,
    "checkIn" DATETIME NOT NULL,
    "checkOut" DATETIME NOT NULL,
    "hoursBooked" INTEGER NOT NULL,
    "totalPrice" REAL NOT NULL,
    status TEXT DEFAULT 'PENDING' NOT NULL,
    source TEXT DEFAULT 'ONLINE' NOT NULL,
    notes TEXT,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "participantCount" INTEGER DEFAULT 1 NOT NULL,
    "unitNumber" INTEGER,
    "consumptionCredit" REAL,
    "bookingConditions" TEXT,
    "requestId" TEXT,
    "receiptToken" TEXT,
    PRIMARY KEY ("id")
);
CREATE TABLE "ReservationDayConfig" (
    id TEXT NOT NULL,
    date date NOT NULL,
    status TEXT DEFAULT 'NORMAL' NOT NULL,
    "reservationsEnabled" INTEGER DEFAULT 1 NOT NULL,
    title TEXT,
    release TEXT,
    "flyerImageUrl" TEXT,
    "highlightOnHome" INTEGER DEFAULT 0 NOT NULL,
    "priceOverrides" TEXT,
    "ticketLots" TEXT,
    "reservableItems" TEXT,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "commercialConditions" TEXT,
    "commercialPeriodId" TEXT,
    PRIMARY KEY ("id")
);
CREATE TABLE "ReservationGlobalConfig" (
    id TEXT DEFAULT 'default' NOT NULL,
    "reservableItems" TEXT,
    "priceOverrides" TEXT,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "commercialConditions" TEXT,
    PRIMARY KEY ("id")
);
CREATE TABLE "SiteContentConfig" (
    id TEXT DEFAULT 'default' NOT NULL,
    content TEXT DEFAULT '{}' NOT NULL,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);
CREATE TABLE "User" (
    id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'STAFF' NOT NULL,
    "passwordHash" TEXT NOT NULL,
    phone TEXT,
    avatar TEXT,
    "isActive" INTEGER DEFAULT 1 NOT NULL,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    PRIMARY KEY ("id")
);
CREATE TABLE "_prisma_migrations" (
    id TEXT NOT NULL,
    checksum TEXT NOT NULL,
    finished_at DATETIME,
    migration_name TEXT NOT NULL,
    logs TEXT,
    rolled_back_at DATETIME,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    applied_steps_count INTEGER DEFAULT 0 NOT NULL
);
CREATE INDEX "AuditLog_action_idx" ON "AuditLog" (action);
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog" ("createdAt");
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog" ("entityId");
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog" (entity);
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog" ("userId");
CREATE INDEX "Cabin_category_idx" ON "Cabin" (category);
CREATE INDEX "Cabin_deletedAt_idx" ON "Cabin" ("deletedAt");
CREATE INDEX "Cabin_deletedOriginalName_idx" ON "Cabin" ("deletedOriginalName");
CREATE INDEX "Cabin_deletedVisibilityStatus_idx" ON "Cabin" ("deletedVisibilityStatus");
CREATE INDEX "Cabin_isActive_idx" ON "Cabin" ("isActive");
CREATE UNIQUE INDEX "Cabin_name_key" ON "Cabin" (name);
CREATE INDEX "Cabin_slug_idx" ON "Cabin" (slug);
CREATE INDEX "Cabin_visibilityStatus_idx" ON "Cabin" ("visibilityStatus");
CREATE INDEX "ClosedDate_date_idx" ON "ClosedDate" (date);
CREATE UNIQUE INDEX "ClosedDate_date_key" ON "ClosedDate" (date);
CREATE INDEX "EventGalleryPhoto_displayOrder_idx" ON "EventGalleryPhoto" ("displayOrder");
CREATE INDEX "EventGalleryPhoto_galleryId_idx" ON "EventGalleryPhoto" ("galleryId");
CREATE INDEX "EventGalleryPhoto_isActive_idx" ON "EventGalleryPhoto" ("isActive");
CREATE INDEX "EventGallery_displayOrder_idx" ON "EventGallery" ("displayOrder");
CREATE INDEX "EventGallery_eventDate_idx" ON "EventGallery" ("eventDate");
CREATE INDEX "EventGallery_isActive_idx" ON "EventGallery" ("isActive");
CREATE INDEX "EventGallery_slug_idx" ON "EventGallery" (slug);
CREATE UNIQUE INDEX "EventGallery_slug_key" ON "EventGallery" (slug);
CREATE INDEX "Event_isActive_idx" ON "Event" ("isActive");
CREATE INDEX "Event_isFeatured_idx" ON "Event" ("isFeatured");
CREATE INDEX "Event_slug_idx" ON "Event" (slug);
CREATE UNIQUE INDEX "Event_slug_key" ON "Event" (slug);
CREATE INDEX "Event_startDate_endDate_idx" ON "Event" ("startDate", "endDate");
CREATE INDEX "GalleryImage_displayOrder_idx" ON "GalleryImage" ("displayOrder");
CREATE INDEX "GalleryImage_isActive_idx" ON "GalleryImage" ("isActive");
CREATE INDEX "MenuCategory_isActive_idx" ON "MenuCategory" ("isActive");
CREATE INDEX "MenuCategory_slug_idx" ON "MenuCategory" (slug);
CREATE UNIQUE INDEX "MenuCategory_slug_key" ON "MenuCategory" (slug);
CREATE INDEX "MenuGalleryImage_displayOrder_idx" ON "MenuGalleryImage" ("displayOrder");
CREATE INDEX "MenuGalleryImage_isActive_idx" ON "MenuGalleryImage" ("isActive");
CREATE INDEX "MenuItem_categoryId_idx" ON "MenuItem" ("categoryId");
CREATE INDEX "MenuItem_isAvailable_idx" ON "MenuItem" ("isAvailable");
CREATE INDEX "PDVOrderItem_menuItemId_idx" ON "PDVOrderItem" ("menuItemId");
CREATE INDEX "PDVOrderItem_orderId_idx" ON "PDVOrderItem" ("orderId");
CREATE INDEX "PDVOrder_reservationId_idx" ON "PDVOrder" ("reservationId");
CREATE INDEX "PDVOrder_status_idx" ON "PDVOrder" (status);
CREATE INDEX "Payment_createdAt_idx" ON "Payment" ("createdAt");
CREATE INDEX "Payment_redeTransactionId_idx" ON "Payment" ("redeTransactionId");
CREATE UNIQUE INDEX "Payment_redeTransactionId_key" ON "Payment" ("redeTransactionId");
CREATE UNIQUE INDEX "Payment_reservationId_key" ON "Payment" ("reservationId");
CREATE INDEX "Payment_status_idx" ON "Payment" (status);
CREATE INDEX "ReservationDayConfig_date_idx" ON "ReservationDayConfig" (date);
CREATE UNIQUE INDEX "ReservationDayConfig_date_key" ON "ReservationDayConfig" (date);
CREATE INDEX "ReservationDayConfig_highlightOnHome_idx" ON "ReservationDayConfig" ("highlightOnHome");
CREATE INDEX "ReservationDayConfig_status_idx" ON "ReservationDayConfig" (status);
CREATE INDEX "Reservation_cabinId_idx" ON "Reservation" ("cabinId");
CREATE INDEX "Reservation_checkIn_checkOut_idx" ON "Reservation" ("checkIn", "checkOut");
CREATE INDEX "Reservation_createdAt_idx" ON "Reservation" ("createdAt");
CREATE UNIQUE INDEX "Reservation_receiptToken_key" ON "Reservation" ("receiptToken");
CREATE UNIQUE INDEX "Reservation_requestId_key" ON "Reservation" ("requestId");
CREATE INDEX "Reservation_source_idx" ON "Reservation" (source);
CREATE INDEX "Reservation_status_idx" ON "Reservation" (status);
CREATE INDEX "User_email_idx" ON "User" (email);
CREATE UNIQUE INDEX "User_email_key" ON "User" (email);
CREATE INDEX "User_role_idx" ON "User" (role);