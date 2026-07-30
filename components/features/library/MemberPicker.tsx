"use client";

interface MemberOption {
  id: string;
  label: string;
}

interface MemberPickerProps {
  memberType: string;
  memberId: string;
  onMemberTypeChange: (memberType: string) => void;
  onMemberIdChange: (memberId: string) => void;
  students: MemberOption[];
  teachers: MemberOption[];
  staff: MemberOption[];
}

// Shared member selector for Issue/Reservation forms — resolves to Student.id, Teacher.id, or
// UserProfile.id depending on memberType (the polymorphic reference; see
// modules/library/domain/book-issue.entity.ts's own comment).
export function MemberPicker({ memberType, memberId, onMemberTypeChange, onMemberIdChange, students, teachers, staff }: MemberPickerProps) {
  const options = memberType === "STUDENT" ? students : memberType === "TEACHER" ? teachers : staff;

  return (
    <>
      <div className="flex flex-col gap-1">
        <label htmlFor="member-type" className="text-xs font-medium text-zinc-500">
          Member Type
        </label>
        <select
          id="member-type"
          value={memberType}
          onChange={(e) => {
            onMemberTypeChange(e.target.value);
            onMemberIdChange("");
          }}
          className="w-36 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
        >
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="STAFF">Staff</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="member-id" className="text-xs font-medium text-zinc-500">
          Member
        </label>
        <select
          id="member-id"
          value={memberId}
          onChange={(e) => onMemberIdChange(e.target.value)}
          className="w-64 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
        >
          <option value="">Select…</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
