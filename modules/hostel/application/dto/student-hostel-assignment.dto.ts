import { z } from "zod";

const dietTypeEnum = z.enum(["VEG", "NON_VEG", "JAIN", "VEGAN", "OTHER"]);

export const checkInStudentHostelSchema = z.object({
  studentId: z.string().uuid("Student is required."),
  academicSessionId: z.string().uuid("Academic session is required."),
  roomId: z.string().uuid("Room is required."),
  bedId: z.string().uuid("Bed is required."),
  dietPreference: dietTypeEnum.optional(),
  checkInDate: z.coerce.date(),
});
export type CheckInStudentHostelServiceInput = z.infer<typeof checkInStudentHostelSchema>;

export const transferStudentHostelSchema = z.object({
  studentId: z.string().uuid("Student is required."),
  academicSessionId: z.string().uuid("Academic session is required."),
  newRoomId: z.string().uuid("New room is required."),
  newBedId: z.string().uuid("New bed is required."),
  transferDate: z.coerce.date(),
});
export type TransferStudentHostelServiceInput = z.infer<typeof transferStudentHostelSchema>;

export const checkOutStudentHostelSchema = z.object({
  studentId: z.string().uuid("Student is required."),
  academicSessionId: z.string().uuid("Academic session is required."),
  checkOutDate: z.coerce.date(),
});
export type CheckOutStudentHostelServiceInput = z.infer<typeof checkOutStudentHostelSchema>;

export interface StudentHostelAssignmentDTO {
  id: string;
  studentId: string;
  academicSessionId: string;
  roomId: string;
  bedId: string;
  dietPreference: string | null;
  checkInDate: string;
  checkOutDate: string | null;
  status: string;
}
