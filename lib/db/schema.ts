import { relations, sql } from "drizzle-orm"
import { index, integer, pgTable, serial, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core"

// User table
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  },
  (users) => ({
    emailIdx: index("email_idx").on(users.email),
  }),
)

// Trip table
export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date", { mode: "date" }),
  endDate: timestamp("end_date", { mode: "date" }),
  location: text("location"),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
})

// Packing list item table
export const packingItems = pgTable("packing_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  packed: boolean("packed").default(false).notNull(),
  quantity: integer("quantity").default(1),
  tripId: uuid("trip_id")
    .references(() => trips.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
})

// Relations
export const tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, {
    fields: [trips.userId],
    references: [users.id],
  }),
  packingItems: many(packingItems),
}))

export const packingItemsRelations = relations(packingItems, ({ one }) => ({
  trip: one(trips, {
    fields: [packingItems.tripId],
    references: [trips.id],
  }),
}))
