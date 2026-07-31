// Pure — kept out of employee-leave-balance.service.ts (which imports "server-only" + Prisma
// repositories at module scope) so it can be unit-tested directly, mirroring
// library-borrow-limit.helpers.ts's "pure logic kept separate from server-only files" pattern.
export interface LeaveBalanceLike {
  allocatedDays: number;
  usedDays: number;
  carriedForwardDays: number;
}

// Available = allocated + carried forward - used. Never floors at zero here — a negative result
// is a legitimate signal (over-drawn balance from a manual adjustment) that callers can surface
// rather than silently hide.
export function computeAvailableLeaveDays(balance: LeaveBalanceLike): number {
  return balance.allocatedDays + balance.carriedForwardDays - balance.usedDays;
}
