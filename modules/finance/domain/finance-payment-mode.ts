// Shared with the Prisma `FinancePaymentMode` enum — its own file so both Expense's entity and
// its DTO/zod schema can import the value type without reaching into the Prisma client from the
// domain layer.
export type FinancePaymentModeValue = "CASH" | "BANK_TRANSFER" | "CHEQUE" | "UPI" | "CARD" | "OTHER";
