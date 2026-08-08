-- Prisma's own bookkeeping table lives in `public` too, so the Data API can
-- reach it just like the others. It holds no customer data, but a writable
-- migration ledger is worth denying anyway: forged rows there would desync
-- migration state and break the next deploy.
--
-- Separate from the previous migration because Prisma creates this table
-- itself, and an applied migration cannot be edited without breaking its
-- checksum.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
