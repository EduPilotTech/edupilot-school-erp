import type { ExamSubjectEntity } from "./exam-subject.entity";

export interface CreateExamSubjectInput {
  tenantId: string;
  examId: string;
  classId: string;
  subjectId: string;
  maxMarks: number;
  passingMarks: number;
  createdBy?: string | null;
}

export interface UpdateExamSubjectInput {
  maxMarks?: number;
  passingMarks?: number;
  isActive?: boolean;
  updatedBy?: string | null;
}

// Every method takes `tenantId` explicitly, per docs/CODING_STANDARDS.md §6.
export interface ExamSubjectRepository {
  findById(tenantId: string, id: string): Promise<ExamSubjectEntity | null>;
  findByExam(tenantId: string, examId: string): Promise<ExamSubjectEntity[]>;
  findByExamAndClass(tenantId: string, examId: string, classId: string): Promise<ExamSubjectEntity[]>;
  create(input: CreateExamSubjectInput): Promise<ExamSubjectEntity>;
  update(tenantId: string, id: string, input: UpdateExamSubjectInput): Promise<ExamSubjectEntity>;
  softDelete(tenantId: string, id: string, deletedBy: string | null): Promise<ExamSubjectEntity>;
}
