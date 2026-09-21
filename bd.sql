-- Logical ecommerce data model.
-- DynamoDB is the runtime database; this SQL file documents collections/entities only.
-- No seed data, credentials, payment secrets, or provider tokens belong here.

CREATE TABLE Users (
    userId VARCHAR(64) PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    displayName VARCHAR(160),
    role VARCHAR(32) NOT NULL DEFAULT 'buyer',
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    stripeCustomerId VARCHAR(64),
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE Merchants (
    merchantId VARCHAR(64) PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    ownerUserId VARCHAR(64),
    defaultCurrency CHAR(3) NOT NULL,
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE MerchantUsers (
    merchantId VARCHAR(64) NOT NULL,
    userId VARCHAR(64) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'admin',
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    createdAt TIMESTAMP NOT NULL,
    PRIMARY KEY (merchantId, userId)
);

CREATE TABLE Categories (
    categoryId VARCHAR(64) PRIMARY KEY,
    merchantId VARCHAR(64) NOT NULL,
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(180) NOT NULL,
    description VARCHAR(1000),
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE Products (
    productId VARCHAR(64) PRIMARY KEY,
    merchantId VARCHAR(64) NOT NULL,
    categoryId VARCHAR(64),
    sku VARCHAR(100),
    name VARCHAR(240) NOT NULL,
    slug VARCHAR(260) NOT NULL,
    description VARCHAR(4000),
    price BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    imageUrl VARCHAR(2000),
    images JSON,
    attributes JSON,
    stock BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE Carts (
    cartId VARCHAR(64) PRIMARY KEY,
    userId VARCHAR(64) NOT NULL,
    merchantId VARCHAR(64) NOT NULL,
    currency CHAR(3) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    expiresAt TIMESTAMP,
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE CartItems (
    cartId VARCHAR(64) NOT NULL,
    productId VARCHAR(64) NOT NULL,
    quantity BIGINT NOT NULL,
    unitAmount BIGINT NOT NULL,
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL,
    PRIMARY KEY (cartId, productId)
);

CREATE TABLE CommercialOrders (
    orderId VARCHAR(64) PRIMARY KEY,
    userId VARCHAR(64) NOT NULL,
    merchantId VARCHAR(64) NOT NULL,
    subtotal BIGINT NOT NULL,
    discount BIGINT NOT NULL DEFAULT 0,
    tax BIGINT NOT NULL DEFAULT 0,
    shippingAmount BIGINT NOT NULL DEFAULT 0,
    total BIGINT NOT NULL,
    currency CHAR(3) NOT NULL,
    paymentId VARCHAR(128),
    paymentStatus VARCHAR(32) NOT NULL DEFAULT 'pending',
    orderStatus VARCHAR(32) NOT NULL DEFAULT 'pending',
    shippingAddress JSON,
    billingAddress JSON,
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE OrderItems (
    orderId VARCHAR(64) NOT NULL,
    lineItemId VARCHAR(64) NOT NULL,
    productId VARCHAR(64) NOT NULL,
    productName VARCHAR(240) NOT NULL,
    sku VARCHAR(100),
    quantity BIGINT NOT NULL,
    unitAmount BIGINT NOT NULL,
    totalAmount BIGINT NOT NULL,
    PRIMARY KEY (orderId, lineItemId)
);

CREATE TABLE Inventory (
    productId VARCHAR(64) PRIMARY KEY,
    merchantId VARCHAR(64) NOT NULL,
    availableQuantity BIGINT NOT NULL DEFAULT 0,
    reservedQuantity BIGINT NOT NULL DEFAULT 0,
    reorderLevel BIGINT NOT NULL DEFAULT 0,
    updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE InventoryReservations (
    reservationId VARCHAR(64) PRIMARY KEY,
    productId VARCHAR(64) NOT NULL,
    orderId VARCHAR(64) NOT NULL,
    quantity BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'reserved',
    expiresAt TIMESTAMP,
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE StripeCustomers (
    userId VARCHAR(64) PRIMARY KEY,
    stripeCustomerId VARCHAR(64) NOT NULL UNIQUE,
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE WalletBalances (
    userId VARCHAR(64) PRIMARY KEY,
    available BIGINT NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL,
    updatedAt TIMESTAMP NOT NULL
);

CREATE TABLE ShippingRecords (
    shipmentId VARCHAR(64) PRIMARY KEY,
    orderId VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    carrier VARCHAR(100),
    trackingNumber VARCHAR(160),
    shippedAt TIMESTAMP,
    deliveredAt TIMESTAMP,
    createdAt TIMESTAMP NOT NULL,
    updatedAt TIMESTAMP NOT NULL
);

-- Existing financial entities remain authoritative for payments:
-- Payments, Refunds, ProviderEvents, LedgerEntries, Balances and Payouts.
