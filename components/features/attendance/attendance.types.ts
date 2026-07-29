export interface SelectOption {
  value: string;
  label: string;
}

// Mirrors components/features/students/admission-form.types.ts's AcademicOptions shape — kept
// as its own copy rather than a shared import so the attendance feature folder doesn't couple to
// the students feature folder for a 3-field option-list type.
export interface AcademicOptions {
  academicSessions: SelectOption[];
  classes: SelectOption[];
  sections: SelectOption[];
}

export const ATTENDANCE_STATUS_OPTIONS: SelectOption[] = [
  { value: "PRESENT", label: "Present" },
  { value: "ABSENT", label: "Absent" },
  { value: "LATE", label: "Late" },
  { value: "HALF_DAY", label: "Half Day" },
  { value: "LEAVE", label: "Leave" },
];
