export interface MyHostelDTO {
  hostelName: string;
  buildingName: string;
  roomNumber: string;
  bedNumber: string;
  dietPreference: string | null;
  checkInDate: string;
  status: string;
  todayMorningStatus: string | null;
  todayNightStatus: string | null;
  pendingLeaveCount: number;
  upcomingApprovedLeave: {
    fromDate: string;
    toDate: string;
    leaveType: string;
  } | null;
}
