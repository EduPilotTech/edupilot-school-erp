export interface BookInventoryRowDTO {
  bookId: string;
  title: string;
  totalCopies: number;
  available: number;
  issued: number;
  reserved: number;
  lost: number;
  damaged: number;
}

export interface CirculationRowDTO {
  bookIssueId: string;
  bookTitle: string;
  accessionNumber: string;
  memberType: string;
  memberName: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  status: string;
}

export interface OverdueRowDTO extends CirculationRowDTO {
  daysOverdue: number;
}

export interface LibraryFineReportRowDTO {
  invoiceId: string;
  bookIssueId: string;
  studentName: string;
  invoiceNumber: string;
  amount: number;
  amountPaid: number;
  balance: number;
  status: string;
}

export interface MostBorrowedBookRowDTO {
  bookId: string;
  title: string;
  borrowCount: number;
}

export interface MemberActivityDTO {
  memberType: string;
  memberId: string;
  memberName: string;
  totalIssued: number;
  currentlyBorrowed: number;
  overdueCount: number;
  lostCount: number;
  damagedCount: number;
}
