// server/src/db/schema.ts
import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  timestamp,
  numeric,
  boolean,
  pgEnum,
  foreignKey,
  json,
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["buyer", "seller", "admin"]);
export const vehicleConditionEnum = pgEnum("vehicle_condition", [
  "new",
  "used",
]);
export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "available",
  "sold",
  "pending",
]);
export const listingTypeEnum = pgEnum("listing_type", ["auction", "fixed"]);
export const listingStatusEnum = pgEnum("listing_status", [
  "active",
  "ended",
  "sold",
  "cancelled",
]);
export const listingReasonEnum = pgEnum("listing_end_reason", [
  "success",
  "unmet",
  "nobids",
  "pending",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("buyer"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id),
  make: varchar("make", { length: 255 }).notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  year: integer("year").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  mileage_hours: integer("mileage_hours").notNull(),
  condition: vehicleConditionEnum("condition").notNull(),
  status: vehicleStatusEnum("status").notNull(),
  description: text("description").notNull(),
  image_url: json("image_url").notNull(), // store ["url1", "url2"]
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Listings table
export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  vehicle_id: integer("vehicle_id")
    .notNull()
    .references(() => vehicles.id),
  seller_id: integer("seller_id")
    .notNull()
    .references(() => users.id),
  type: listingTypeEnum("type").notNull(),
  start_price: numeric("start_price", { precision: 12, scale: 2 }).notNull(),
  reserve_price: numeric("reserve_price", {
    precision: 12,
    scale: 2,
  }).notNull(),
  buy_now_price: numeric("buy_now_price", { precision: 12, scale: 2 }),
  current_price: numeric("current_price", {
    precision: 12,
    scale: 2,
  }).notNull(),
  start_time: timestamp("start_time").notNull(),
  end_time: timestamp("end_time").notNull(),
  status: listingStatusEnum("status").notNull(),
  end_reason: listingReasonEnum("end_reason"),
  views_count: integer("views_count").default(0).notNull(),
  location: varchar("location", { length: 255 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  buyer_id: integer("buyer_id")
    .notNull()
    .references(() => users.id),
  seller_id: integer("seller_id")
    .notNull()
    .references(() => users.id),
  listing_id: integer("listing_id")
    .notNull()
    .references(() => listings.id),
  final_price: numeric("final_price", { precision: 12, scale: 2 }).notNull(),
  payment_status: paymentStatusEnum("payment_status")
    .notNull()
    .default("pending"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Bids table
export const bids = pgTable("bids", {
  id: serial("id").primaryKey(),
  listing_id: integer("listing_id")
    .notNull()
    .references(() => listings.id),
  bidder_id: integer("bidder_id")
    .notNull()
    .references(() => users.id),
  bid_amount: numeric("bid_amount", { precision: 12, scale: 2 }).notNull(),
  bid_time: timestamp("bid_time").defaultNow().notNull(),
  location: varchar("location", { length: 255 }),
});
