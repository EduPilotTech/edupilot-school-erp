export interface RoomOccupancyRowDTO {
  roomId: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  occupiedCount: number;
  vacantCount: number;
  occupancyPercent: number;
}

export interface RoomOccupancyReportDTO {
  hostelId: string;
  rows: RoomOccupancyRowDTO[];
}

export interface BedOccupancyRowDTO {
  bedId: string;
  bedNumber: string;
  roomId: string;
  roomNumber: string;
  status: string;
  occupantStudentId: string | null;
  occupantName: string | null;
}

export interface VacantBedRowDTO {
  bedId: string;
  bedNumber: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  gender: string;
}

export interface HostelAttendanceSummaryDTO {
  roomId: string;
  date: string;
  session: string;
  presentCount: number;
  absentCount: number;
  onLeaveCount: number;
}

export interface HostelLeaveReportRowDTO {
  id: string;
  studentId: string;
  studentName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  status: string;
  actualReturnDate: string | null;
}

export interface HostelVisitorReportRowDTO {
  id: string;
  studentId: string;
  studentName: string;
  visitorName: string;
  relation: string;
  purpose: string;
  entryTime: string;
  exitTime: string | null;
}

export interface HostelFeeCollectionRowDTO {
  hostelId: string;
  hostelName: string;
  totalCollected: number;
  totalOutstanding: number;
}

export interface HostelFeeCollectionReportDTO {
  academicSessionId: string;
  rows: HostelFeeCollectionRowDTO[];
}
