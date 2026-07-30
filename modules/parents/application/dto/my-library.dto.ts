export interface MyLibraryIssueDTO {
  bookIssueId: string;
  bookTitle: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
  isOverdue: boolean;
}

export interface MyLibraryReservationDTO {
  reservationId: string;
  bookTitle: string;
  status: string;
  reservationDate: string;
}

export interface MyLibraryDTO {
  currentlyIssued: MyLibraryIssueDTO[];
  history: MyLibraryIssueDTO[];
  overdueCount: number;
  totalFineDue: number;
  reservations: MyLibraryReservationDTO[];
}
