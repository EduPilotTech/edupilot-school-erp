import { z } from "zod";

const memberTypeEnum = z.enum(["STUDENT", "TEACHER", "STAFF"]);

export const reserveBookSchema = z.object({
  bookId: z.string().uuid("Book is required."),
  memberType: memberTypeEnum,
  memberId: z.string().uuid("Member is required."),
  reservationDate: z.coerce.date(),
});
export type ReserveBookServiceInput = z.infer<typeof reserveBookSchema>;

export interface BookReservationDTO {
  id: string;
  bookId: string;
  memberType: z.infer<typeof memberTypeEnum>;
  memberId: string;
  reservationDate: string;
  status: "PENDING" | "AVAILABLE" | "FULFILLED" | "CANCELLED" | "EXPIRED";
  notifiedAt: string | null;
  fulfilledBookIssueId: string | null;
}
