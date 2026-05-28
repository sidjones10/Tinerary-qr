-- Remove the Tinerary Coins system entirely.
-- Drops the tables, functions, policies, and profile columns introduced by:
--   - db/migrations/05_creator_monetization_tables.sql (coin_transactions, profiles.coin_balance)
--   - supabase/migrations/052_tinerary_coins_system.sql
--   - supabase/migrations/060_fix_coins_schema.sql (coin-awarding RPCs only — the
--     referrals and reviews tables are kept; those features remain).
--
-- The `account_tier` column on `profiles` is preserved because other
-- features (promotion targeting, admin business listings) depend on it.

DROP FUNCTION IF EXISTS spend_coins(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS award_coins(UUID, INTEGER, TEXT, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS ensure_coin_balance(UUID);

DROP TABLE IF EXISTS coin_redemptions CASCADE;
DROP TABLE IF EXISTS coin_transactions CASCADE;
DROP TABLE IF EXISTS coin_balances CASCADE;

ALTER TABLE profiles DROP COLUMN IF EXISTS coin_balance;
