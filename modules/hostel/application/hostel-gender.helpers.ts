import type { RoomGenderTypeValue } from "../domain/hostel-room.entity";

// Student.gender (MALE/FEMALE/OTHER, nullable) is a different vocabulary from Room.gender
// (BOYS/GIRLS/CO_ED). A CO_ED room accepts anyone; a student with no gender recorded is
// permitted anywhere (the field isn't mandatory on Student — see Sprint 4's own admission
// scoping), so this only actively rejects a known mismatch, never a missing value.
export function isGenderCompatible(studentGender: string | null, roomGender: RoomGenderTypeValue): boolean {
  if (roomGender === "CO_ED") return true;
  if (studentGender === null) return true;
  if (studentGender === "MALE") return roomGender === "BOYS";
  if (studentGender === "FEMALE") return roomGender === "GIRLS";
  return false;
}
