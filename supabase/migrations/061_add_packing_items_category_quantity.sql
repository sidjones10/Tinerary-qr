-- Add category and quantity columns to packing_items
-- These fields support the packing list UI's category grouping and item quantities

ALTER TABLE packing_items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE packing_items ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
