export interface TimetableGridEntryDTO {
  id: string;
  dayOfWeek: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName: string;
  className: string;
  sectionName: string;
  classroomName: string | null;
}
