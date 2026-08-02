// Seeds System Roles, Permissions, and RolePermission grants only — no Tenant, School, or
// UserProfile rows. Per Sprint 3 — Step 5 Part B ("Do NOT seed customer data") and
// docs/DATABASE_STANDARDS.md §8, this file never contains real school/customer records.
//
// Cannot be run against a real database yet: no migration has ever been applied (see
// docs/PHASE_STATUS.md) — this script is written and typechecked ahead of that, ready to run
// the moment the first migration lands, via `npx prisma db seed`.
//
// Idempotent (every write is an upsert keyed by a stable code), safe to re-run.
import { prisma } from "../lib/prisma";

const SYSTEM_ROLES = [
  { code: "SUPER_ADMIN", name: "Super Admin", isProtected: true },
  { code: "SCHOOL_ADMIN", name: "School Admin", isProtected: true },
  { code: "PRINCIPAL", name: "Principal", isProtected: false },
  { code: "VICE_PRINCIPAL", name: "Vice Principal", isProtected: false },
  { code: "TEACHER", name: "Teacher", isProtected: false },
  { code: "CLASS_TEACHER", name: "Class Teacher", isProtected: false },
  { code: "ACCOUNTANT", name: "Accountant", isProtected: false },
  { code: "RECEPTIONIST", name: "Receptionist", isProtected: false },
  { code: "LIBRARIAN", name: "Librarian", isProtected: false },
  { code: "PARENT", name: "Parent", isProtected: false },
  { code: "STUDENT", name: "Student", isProtected: false },
  // Phase 8 — front-desk cash collection only (fee.payment.collect + fee.receipt.print), a
  // narrower role than ACCOUNTANT (structures/concessions/reversals/reports). No existing role
  // fit this scope: RECEPTIONIST is front-office but not fee-specific, ACCOUNTANT is broader.
  { code: "CASHIER", name: "Cashier", isProtected: false },
  // Phase 10 — day-to-day transport operations (vehicles, drivers, helpers, routes, stops,
  // assignments, daily boarding attendance). Mirrors CASHIER's own precedent: a narrower,
  // module-specific role rather than overloading SCHOOL_ADMIN or an unrelated existing role.
  { code: "TRANSPORT_MANAGER", name: "Transport Manager", isProtected: false },
  // Phase 11 — day-to-day hostel operations (rooms, beds, student assignment/transfer, daily
  // attendance, leave approval, visitor register, mess). Mirrors TRANSPORT_MANAGER's own
  // precedent exactly: a narrower, module-specific role rather than overloading SCHOOL_ADMIN.
  { code: "HOSTEL_WARDEN", name: "Hostel Warden", isProtected: false },
  // Phase 13 — HR & Payroll Management. Two narrower, module-specific roles mirroring
  // TRANSPORT_MANAGER/HOSTEL_WARDEN's own precedent: HR_MANAGER owns day-to-day HR operations
  // (employee records, leave, performance reviews); PAYROLL_OFFICER owns salary structures,
  // loans/advances, payroll runs, and salary payments. Kept separate rather than merged into one
  // role since a school may staff these as two distinct back-office functions.
  { code: "HR_MANAGER", name: "HR Manager", isProtected: false },
  { code: "PAYROLL_OFFICER", name: "Payroll Officer", isProtected: false },
] as const;

// Only Super Admin and School Admin hold the base admin permission set — every other system
// role is a non-administrative staff/portal role with none of those grants by default.
const ADMIN_ROLE_CODES = ["SUPER_ADMIN", "SCHOOL_ADMIN"] as const;

// Phase 13 — every staff-facing system role that can plausibly hold an Employee HR record (i.e.
// everyone except PARENT and STUDENT). Used to grant the Employee Portal self-service permission
// broadly: "Employee can access ONLY own records" (security requirement) is enforced by ownership
// checks inside modules/hr/application/employee-portal.service.ts itself (ties every read to the
// caller's own employeeId, resolved server-side from their session — never client input), not by
// narrowing which roles may reach the endpoint at all.
const EMPLOYEE_ROLE_CODES = [
  ...ADMIN_ROLE_CODES,
  "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER", "CLASS_TEACHER", "ACCOUNTANT", "RECEPTIONIST",
  "LIBRARIAN", "CASHIER", "TRANSPORT_MANAGER", "HOSTEL_WARDEN", "HR_MANAGER", "PAYROLL_OFFICER",
] as const;

// The 9 permission codes actually referenced by working code in this codebase (modules/users'
// application services and app/settings/users/actions.ts), the 3 Sprint 4.8A document-management
// codes, the 2 Sprint 4.9 ID card codes, the 4 Phase 5 attendance codes, the 11 Phase 6
// timetable-management codes, the 15 Phase 7 examination-management codes, the 20 Phase 8
// fee-management-and-billing codes, the Phase 9 parent-portal-and-communication codes, the
// Phase 10 transport-management codes (11 `transport.*` staff-side + 1 `parent.transport.view`),
// the Phase 11 hostel-management codes (11 `hostel.*` staff-side + 1 `parent.hostel.view`), and —
// as of Phase 12 — the 8 library-management codes (7 `library.*` staff-side + 1
// `parent.library.view`), and — as of Phase 13 — the 11 HR-and-payroll-management codes (10
// `hr.*`/`payroll.*` staff-side + 1 `employee.portal.access`). Every code here still follows the
// file's original principle (only seed what real code references, or what a task explicitly asks
// to seed ahead of its code — see Sprint 4.8A's own comment history for that exception).
//
// Each entry now carries its own `roles` list rather than every permission going to the same
// ADMIN_ROLE_CODES set — needed as of Sprint 4.9, whose 3-tier access model
// (Admin/Office/Teacher-view-only) is the first permission that ISN'T simply "admins only."
// "Office" maps to the existing RECEPTIONIST role — no "Office" role exists in SYSTEM_ROLES, and
// none was added; RECEPTIONIST is the closest existing match for front-office staff.
const PERMISSIONS = [
  { code: "user.invite", resource: "user", action: "invite", roles: ADMIN_ROLE_CODES },
  { code: "user.update", resource: "user", action: "update", roles: ADMIN_ROLE_CODES },
  { code: "user.suspend", resource: "user", action: "suspend", roles: ADMIN_ROLE_CODES },
  { code: "user.activate", resource: "user", action: "activate", roles: ADMIN_ROLE_CODES },
  { code: "user.deactivate", resource: "user", action: "deactivate", roles: ADMIN_ROLE_CODES },
  { code: "user.delete", resource: "user", action: "delete", roles: ADMIN_ROLE_CODES },
  { code: "user.restore", resource: "user", action: "restore", roles: ADMIN_ROLE_CODES },
  { code: "role.assign", resource: "role", action: "assign", roles: ADMIN_ROLE_CODES },
  { code: "role.remove", resource: "role", action: "remove", roles: ADMIN_ROLE_CODES },
  { code: "student.document.upload", resource: "student.document", action: "upload", roles: ADMIN_ROLE_CODES },
  { code: "student.document.delete", resource: "student.document", action: "delete", roles: ADMIN_ROLE_CODES },
  { code: "student.photo.upload", resource: "student.photo", action: "upload", roles: ADMIN_ROLE_CODES },
  {
    code: "student.idcard.view",
    resource: "student.idcard",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "RECEPTIONIST", "TEACHER", "CLASS_TEACHER"] as const,
  },
  {
    code: "student.idcard.print",
    resource: "student.idcard",
    action: "print",
    roles: [...ADMIN_ROLE_CODES, "RECEPTIONIST"] as const,
  },
  // Completion Pass — Transfer Certificate / Certificate branding (checklist #10, #11). One code
  // covers both document types — same "print an official student document" action category as
  // student.idcard.print, same role set.
  {
    code: "student.certificate.print",
    resource: "student.certificate",
    action: "print",
    roles: [...ADMIN_ROLE_CODES, "RECEPTIONIST"] as const,
  },
  // Phase 5 — Attendance Management. Two resources (student vs. teacher attendance), each split
  // into mark/view so Receptionist can be granted view-only per the task's own 5-tier requirement
  // ("Receptionist (View Only)"). Teacher/Class Teacher can mark and view STUDENT attendance
  // (they take daily roll call) but not staff attendance — marking colleagues' attendance is an
  // admin/Principal-level action, not a teacher one.
  {
    code: "attendance.student.mark",
    resource: "attendance.student",
    action: "mark",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "TEACHER", "CLASS_TEACHER"] as const,
  },
  {
    code: "attendance.student.view",
    resource: "attendance.student",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "TEACHER", "CLASS_TEACHER", "RECEPTIONIST"] as const,
  },
  {
    code: "attendance.teacher.mark",
    resource: "attendance.teacher",
    action: "mark",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL"] as const,
  },
  {
    code: "attendance.teacher.view",
    resource: "attendance.teacher",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "RECEPTIONIST"] as const,
  },
  // Phase 6 — Timetable Management. Matches the architecture review's approved permission
  // matrix exactly. "school.config" (not "school-config") keeps every resource name dot-
  // namespaced, consistent with "student.document"/"attendance.student" above — no hyphenated
  // resource strings exist anywhere else in this file.
  {
    code: "subject.manage",
    resource: "subject",
    action: "manage",
    roles: ADMIN_ROLE_CODES,
  },
  {
    code: "subject.view",
    resource: "subject",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER", "CLASS_TEACHER"] as const,
  },
  {
    code: "classroom.manage",
    resource: "classroom",
    action: "manage",
    roles: ADMIN_ROLE_CODES,
  },
  {
    code: "classroom.view",
    resource: "classroom",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER", "CLASS_TEACHER"] as const,
  },
  // Academic Setup — Academic Session / Class / Section master data (the data Student Admission's
  // dropdowns read from). Distinct resource names from "classroom" — a Classroom is a physical
  // room, these are the academic-structure equivalents.
  {
    code: "academic-session.manage",
    resource: "academic-session",
    action: "manage",
    roles: ADMIN_ROLE_CODES,
  },
  {
    code: "academic-session.view",
    resource: "academic-session",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER", "CLASS_TEACHER"] as const,
  },
  {
    code: "class.manage",
    resource: "class",
    action: "manage",
    roles: ADMIN_ROLE_CODES,
  },
  {
    code: "class.view",
    resource: "class",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER", "CLASS_TEACHER"] as const,
  },
  {
    code: "section.manage",
    resource: "section",
    action: "manage",
    roles: ADMIN_ROLE_CODES,
  },
  {
    code: "section.view",
    resource: "section",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER", "CLASS_TEACHER"] as const,
  },
  {
    code: "teacher.manage",
    resource: "teacher",
    action: "manage",
    roles: ADMIN_ROLE_CODES,
  },
  {
    code: "teacher.view",
    resource: "teacher",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "VICE_PRINCIPAL"] as const,
  },
  {
    code: "teacher.assignment.manage",
    resource: "teacher.assignment",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL"] as const,
  },
  {
    code: "school.config.manage",
    resource: "school.config",
    action: "manage",
    roles: ADMIN_ROLE_CODES,
  },
  // Product Completion Phase 17 Bundle A — School Branding (logo, letterhead, theme color,
  // social links). Distinct resource from "school.config" (Phase 6 timetable-config settings) —
  // branding is presentation-layer, not the school's academic-year configuration.
  {
    code: "school.branding.manage",
    resource: "school.branding",
    action: "manage",
    roles: ADMIN_ROLE_CODES,
  },
  {
    code: "school.branding.view",
    resource: "school.branding",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "VICE_PRINCIPAL"] as const,
  },
  {
    code: "timetable.manage",
    resource: "timetable",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "VICE_PRINCIPAL"] as const,
  },
  {
    code: "timetable.view",
    resource: "timetable",
    action: "view",
    roles: [
      ...ADMIN_ROLE_CODES,
      "PRINCIPAL",
      "VICE_PRINCIPAL",
      "TEACHER",
      "CLASS_TEACHER",
      "RECEPTIONIST",
    ] as const,
  },
  {
    code: "timetable.print",
    resource: "timetable",
    action: "print",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "RECEPTIONIST"] as const,
  },
  // Phase 7 — Examination & Assessment Management. Matches the approved architecture review's
  // permission matrix. `marks.entry` is granted broadly to Teacher/Class Teacher at the RBAC
  // layer — the narrower "only your own TeacherAssignment" rule is enforced in
  // marks-authorization.helpers.ts, not here (RBAC only ever answers "can this role act at all,"
  // never "on which specific rows" — same division of responsibility as every other permission
  // in this file). `result.generate` and `result.publish` are separate codes (not folded into
  // one) so a school can grant "compute results" without also granting "lock them in publicly,"
  // mirroring how `student.idcard.view`/`.print` are already split.
  {
    code: "examtype.manage",
    resource: "examtype",
    action: "manage",
    roles: ADMIN_ROLE_CODES,
  },
  {
    code: "examtype.view",
    resource: "examtype",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER", "CLASS_TEACHER"] as const,
  },
  {
    code: "exam.manage",
    resource: "exam",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "VICE_PRINCIPAL"] as const,
  },
  {
    code: "exam.view",
    resource: "exam",
    action: "view",
    roles: [
      ...ADMIN_ROLE_CODES,
      "PRINCIPAL",
      "VICE_PRINCIPAL",
      "TEACHER",
      "CLASS_TEACHER",
      "RECEPTIONIST",
    ] as const,
  },
  {
    code: "exam.subject.manage",
    resource: "exam.subject",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL"] as const,
  },
  {
    code: "grade.manage",
    resource: "grade",
    action: "manage",
    roles: ADMIN_ROLE_CODES,
  },
  {
    code: "grade.view",
    resource: "grade",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER", "CLASS_TEACHER"] as const,
  },
  {
    code: "marks.entry",
    resource: "marks",
    action: "entry",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "TEACHER", "CLASS_TEACHER"] as const,
  },
  {
    code: "marks.view",
    resource: "marks",
    action: "view",
    roles: [
      ...ADMIN_ROLE_CODES,
      "PRINCIPAL",
      "VICE_PRINCIPAL",
      "TEACHER",
      "CLASS_TEACHER",
      "RECEPTIONIST",
    ] as const,
  },
  {
    code: "result.generate",
    resource: "result",
    action: "generate",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL"] as const,
  },
  {
    code: "result.publish",
    resource: "result",
    action: "publish",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL"] as const,
  },
  {
    code: "result.view",
    resource: "result",
    action: "view",
    roles: [
      ...ADMIN_ROLE_CODES,
      "PRINCIPAL",
      "VICE_PRINCIPAL",
      "TEACHER",
      "CLASS_TEACHER",
      "RECEPTIONIST",
    ] as const,
  },
  {
    code: "reportcard.print",
    resource: "reportcard",
    action: "print",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "RECEPTIONIST"] as const,
  },
  {
    code: "ranking.view",
    resource: "ranking",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER", "CLASS_TEACHER"] as const,
  },
  {
    code: "student.promote",
    resource: "student",
    action: "promote",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL"] as const,
  },
  // Phase 8 — Fee Management & Billing. Matches the approved architecture review's permission
  // matrix. CASHIER is deliberately the narrowest role here (collect + print only) — structure/
  // concession/reversal/report authority stays with ACCOUNTANT and above, per Decision 1's own
  // reasoning for adding a dedicated role rather than overloading RECEPTIONIST/ACCOUNTANT.
  {
    code: "feecategory.manage",
    resource: "feecategory",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT"] as const,
  },
  {
    code: "feecategory.view",
    resource: "feecategory",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT", "PRINCIPAL", "CASHIER"] as const,
  },
  {
    code: "feestructure.manage",
    resource: "feestructure",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT"] as const,
  },
  {
    code: "feestructure.view",
    resource: "feestructure",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT", "PRINCIPAL"] as const,
  },
  {
    code: "feeassignment.manage",
    resource: "feeassignment",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT"] as const,
  },
  {
    code: "feeassignment.view",
    resource: "feeassignment",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT", "PRINCIPAL"] as const,
  },
  {
    code: "fee.finerule.manage",
    resource: "fee.finerule",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT"] as const,
  },
  {
    code: "fee.installmentplan.manage",
    resource: "fee.installmentplan",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT"] as const,
  },
  {
    code: "fee.generate",
    resource: "fee",
    action: "generate",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT"] as const,
  },
  {
    code: "fee.invoice.view",
    resource: "fee.invoice",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT", "PRINCIPAL", "CASHIER"] as const,
  },
  {
    code: "fee.invoice.cancel",
    resource: "fee.invoice",
    action: "cancel",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT"] as const,
  },
  {
    code: "fee.payment.collect",
    resource: "fee.payment",
    action: "collect",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT", "CASHIER"] as const,
  },
  {
    code: "fee.payment.view",
    resource: "fee.payment",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT", "PRINCIPAL", "CASHIER"] as const,
  },
  {
    code: "fee.payment.reverse",
    resource: "fee.payment",
    action: "reverse",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT"] as const,
  },
  {
    code: "fee.receipt.print",
    resource: "fee.receipt",
    action: "print",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT", "CASHIER"] as const,
  },
  {
    code: "fee.concession.manage",
    resource: "fee.concession",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT", "PRINCIPAL"] as const,
  },
  {
    code: "fee.concession.view",
    resource: "fee.concession",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT", "PRINCIPAL"] as const,
  },
  {
    code: "fee.ledger.view",
    resource: "fee.ledger",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT", "PRINCIPAL"] as const,
  },
  {
    code: "fee.report.daily.view",
    resource: "fee.report.daily",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT", "PRINCIPAL", "CASHIER"] as const,
  },
  {
    code: "fee.report.outstanding.view",
    resource: "fee.report.outstanding",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT", "PRINCIPAL"] as const,
  },
  {
    code: "fee.report.classcollection.view",
    resource: "fee.report.classcollection",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT", "PRINCIPAL"] as const,
  },
  {
    code: "fee.auditlog.view",
    resource: "fee.auditlog",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL"] as const,
  },
  // Phase 9 — Parent Portal & Communication. `parent.*` codes are the first block in this file
  // granted EXCLUSIVELY to the PARENT role — every parent-facing service is additionally gated
  // by assertGuardianCanAccessStudent (row-level scoping RBAC alone can't express "only MY OWN
  // children"), so RBAC here only ever answers "is this user a parent at all." `communication.*`
  // codes are the staff-side counterpart: composing/publishing Notices, creating Homework,
  // managing the Calendar, and teacher-initiated messaging.
  {
    code: "parent.dashboard.view",
    resource: "parent.dashboard",
    action: "view",
    roles: ["PARENT"] as const,
  },
  {
    code: "parent.student.view",
    resource: "parent.student",
    action: "view",
    roles: ["PARENT"] as const,
  },
  {
    code: "parent.attendance.view",
    resource: "parent.attendance",
    action: "view",
    roles: ["PARENT"] as const,
  },
  {
    code: "parent.result.view",
    resource: "parent.result",
    action: "view",
    roles: ["PARENT"] as const,
  },
  {
    code: "parent.reportcard.print",
    resource: "parent.reportcard",
    action: "print",
    roles: ["PARENT"] as const,
  },
  {
    code: "parent.fee.view",
    resource: "parent.fee",
    action: "view",
    roles: ["PARENT"] as const,
  },
  {
    code: "parent.payment.view",
    resource: "parent.payment",
    action: "view",
    roles: ["PARENT"] as const,
  },
  {
    code: "parent.receipt.print",
    resource: "parent.receipt",
    action: "print",
    roles: ["PARENT"] as const,
  },
  {
    code: "parent.homework.view",
    resource: "parent.homework",
    action: "view",
    roles: ["PARENT"] as const,
  },
  {
    code: "parent.notice.view",
    resource: "parent.notice",
    action: "view",
    roles: ["PARENT"] as const,
  },
  {
    code: "parent.calendar.view",
    resource: "parent.calendar",
    action: "view",
    roles: ["PARENT"] as const,
  },
  {
    code: "parent.message.send",
    resource: "parent.message",
    action: "send",
    roles: ["PARENT"] as const,
  },
  {
    code: "parent.message.view",
    resource: "parent.message",
    action: "view",
    roles: ["PARENT"] as const,
  },
  {
    code: "parent.notification.view",
    resource: "parent.notification",
    action: "view",
    roles: ["PARENT"] as const,
  },
  {
    code: "parent.account.link",
    resource: "parent.account",
    action: "link",
    roles: [...ADMIN_ROLE_CODES, "RECEPTIONIST"] as const,
  },
  {
    code: "communication.homework.manage",
    resource: "communication.homework",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "TEACHER", "CLASS_TEACHER"] as const,
  },
  {
    code: "communication.homework.view",
    resource: "communication.homework",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER", "CLASS_TEACHER"] as const,
  },
  {
    code: "communication.notice.manage",
    resource: "communication.notice",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL"] as const,
  },
  {
    code: "communication.notice.view",
    resource: "communication.notice",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER", "CLASS_TEACHER", "RECEPTIONIST"] as const,
  },
  {
    code: "communication.calendar.manage",
    resource: "communication.calendar",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL"] as const,
  },
  {
    code: "communication.calendar.view",
    resource: "communication.calendar",
    action: "view",
    roles: [
      ...ADMIN_ROLE_CODES,
      "PRINCIPAL",
      "VICE_PRINCIPAL",
      "TEACHER",
      "CLASS_TEACHER",
      "RECEPTIONIST",
    ] as const,
  },
  {
    code: "communication.message.send",
    resource: "communication.message",
    action: "send",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "TEACHER", "CLASS_TEACHER"] as const,
  },
  {
    code: "communication.message.view",
    resource: "communication.message",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL", "TEACHER", "CLASS_TEACHER"] as const,
  },
  // Phase 10 — Transport Management. Manage-type codes go to Admin + the new TRANSPORT_MANAGER
  // role; view/report codes add PRINCIPAL for oversight, mirroring the Fee module's own
  // ADMIN+ACCOUNTANT+PRINCIPAL pattern. parent.transport.view follows the existing parent.*.view
  // naming convention exactly (PARENT role only).
  {
    code: "transport.vehicle.manage",
    resource: "transport.vehicle",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "TRANSPORT_MANAGER"] as const,
  },
  {
    code: "transport.driver.manage",
    resource: "transport.driver",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "TRANSPORT_MANAGER"] as const,
  },
  {
    code: "transport.helper.manage",
    resource: "transport.helper",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "TRANSPORT_MANAGER"] as const,
  },
  {
    code: "transport.route.manage",
    resource: "transport.route",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "TRANSPORT_MANAGER"] as const,
  },
  {
    code: "transport.stop.manage",
    resource: "transport.stop",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "TRANSPORT_MANAGER"] as const,
  },
  {
    code: "transport.assignment.manage",
    resource: "transport.assignment",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "TRANSPORT_MANAGER"] as const,
  },
  {
    code: "transport.student-assignment.manage",
    resource: "transport.student-assignment",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "TRANSPORT_MANAGER"] as const,
  },
  {
    code: "transport.fee-rule.manage",
    resource: "transport.fee-rule",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "TRANSPORT_MANAGER", "ACCOUNTANT"] as const,
  },
  {
    code: "transport.attendance.mark",
    resource: "transport.attendance",
    action: "mark",
    roles: [...ADMIN_ROLE_CODES, "TRANSPORT_MANAGER"] as const,
  },
  {
    code: "transport.attendance.view",
    resource: "transport.attendance",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "TRANSPORT_MANAGER", "PRINCIPAL"] as const,
  },
  {
    code: "transport.report.view",
    resource: "transport.report",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "TRANSPORT_MANAGER", "PRINCIPAL"] as const,
  },
  {
    code: "parent.transport.view",
    resource: "parent.transport",
    action: "view",
    roles: ["PARENT"] as const,
  },
  // Phase 11 — Hostel Management. Manage-type codes go to Admin + the new HOSTEL_WARDEN role;
  // view/report codes add PRINCIPAL for oversight, mirroring transport.*'s own
  // ADMIN+TRANSPORT_MANAGER+PRINCIPAL pattern exactly. parent.hostel.view follows the existing
  // parent.*.view naming convention (PARENT role only).
  {
    code: "hostel.manage",
    resource: "hostel",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "HOSTEL_WARDEN"] as const,
  },
  {
    code: "hostel.room.manage",
    resource: "hostel.room",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "HOSTEL_WARDEN"] as const,
  },
  {
    code: "hostel.bed.manage",
    resource: "hostel.bed",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "HOSTEL_WARDEN"] as const,
  },
  {
    code: "hostel.assignment.manage",
    resource: "hostel.assignment",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "HOSTEL_WARDEN"] as const,
  },
  {
    code: "hostel.attendance.mark",
    resource: "hostel.attendance",
    action: "mark",
    roles: [...ADMIN_ROLE_CODES, "HOSTEL_WARDEN"] as const,
  },
  {
    code: "hostel.attendance.view",
    resource: "hostel.attendance",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "HOSTEL_WARDEN", "PRINCIPAL"] as const,
  },
  {
    code: "hostel.leave.manage",
    resource: "hostel.leave",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "HOSTEL_WARDEN"] as const,
  },
  {
    code: "hostel.visitor.manage",
    resource: "hostel.visitor",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "HOSTEL_WARDEN"] as const,
  },
  {
    code: "hostel.mess.manage",
    resource: "hostel.mess",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "HOSTEL_WARDEN"] as const,
  },
  {
    code: "hostel.fee-rule.manage",
    resource: "hostel.fee-rule",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "HOSTEL_WARDEN", "ACCOUNTANT"] as const,
  },
  {
    code: "hostel.report.view",
    resource: "hostel.report",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "HOSTEL_WARDEN", "PRINCIPAL"] as const,
  },
  {
    code: "parent.hostel.view",
    resource: "parent.hostel",
    action: "view",
    roles: ["PARENT"] as const,
  },
  // Phase 12 — Library Management. Manage-type codes go to Admin + the existing LIBRARIAN role
  // (seeded since Phase 1, unused until now); library.fine.manage also adds ACCOUNTANT, mirroring
  // hostel.fee-rule.manage's own precedent since generating/waiving a fine invoice is a
  // fee-collection-adjacent action. library.report.view adds PRINCIPAL for oversight.
  // parent.library.view follows the existing parent.*.view naming convention (PARENT role only).
  {
    code: "library.manage",
    resource: "library",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "LIBRARIAN"] as const,
  },
  {
    code: "library.catalog.manage",
    resource: "library.catalog",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "LIBRARIAN"] as const,
  },
  {
    code: "library.inventory.manage",
    resource: "library.inventory",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "LIBRARIAN"] as const,
  },
  {
    code: "library.circulation.manage",
    resource: "library.circulation",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "LIBRARIAN"] as const,
  },
  {
    code: "library.reservation.manage",
    resource: "library.reservation",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "LIBRARIAN"] as const,
  },
  {
    code: "library.fine.manage",
    resource: "library.fine",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "LIBRARIAN", "ACCOUNTANT"] as const,
  },
  {
    code: "library.report.view",
    resource: "library.report",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "LIBRARIAN", "PRINCIPAL"] as const,
  },
  {
    code: "parent.library.view",
    resource: "parent.library",
    action: "view",
    roles: ["PARENT"] as const,
  },
  // Phase 13 — HR & Payroll Management. Manage-type codes go to Admin + the new HR_MANAGER/
  // PAYROLL_OFFICER roles, mirroring TRANSPORT_MANAGER/HOSTEL_WARDEN's own precedent exactly;
  // report-view codes additionally add PRINCIPAL for oversight. Staff attendance MARKING reuses
  // the existing Phase 5 `attendance.teacher.mark`/`attendance.teacher.view` codes — no duplicate
  // codes are created for it here. `employee.portal.access` is the one Employee-Portal-wide code,
  // granted to EMPLOYEE_ROLE_CODES (every staff role, not just HR/Payroll) since it gates a
  // self-service surface every employee — not just HR/Payroll staff — must be able to reach; the
  // "own records only" restriction is enforced inside the application service itself, not by RBAC.
  {
    code: "hr.master.manage",
    resource: "hr.master",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "HR_MANAGER"] as const,
  },
  {
    code: "hr.employee.manage",
    resource: "hr.employee",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "HR_MANAGER"] as const,
  },
  {
    code: "hr.leave.manage",
    resource: "hr.leave",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "HR_MANAGER"] as const,
  },
  {
    code: "hr.performance.manage",
    resource: "hr.performance",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "HR_MANAGER"] as const,
  },
  {
    code: "hr.report.view",
    resource: "hr.report",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "HR_MANAGER", "PRINCIPAL"] as const,
  },
  {
    code: "payroll.structure.manage",
    resource: "payroll.structure",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "PAYROLL_OFFICER"] as const,
  },
  {
    code: "payroll.loan.manage",
    resource: "payroll.loan",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "PAYROLL_OFFICER"] as const,
  },
  {
    code: "payroll.run.manage",
    resource: "payroll.run",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "PAYROLL_OFFICER"] as const,
  },
  {
    code: "payroll.payment.manage",
    resource: "payroll.payment",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "PAYROLL_OFFICER"] as const,
  },
  {
    code: "payroll.report.view",
    resource: "payroll.report",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PAYROLL_OFFICER", "PRINCIPAL"] as const,
  },
  {
    code: "employee.portal.access",
    resource: "employee.portal",
    action: "access",
    roles: EMPLOYEE_ROLE_CODES,
  },
  // Phase 14 — Finance & Accounts. A simple cash/bank ledger for private schools, restricted to
  // Admin + the two existing roles the spec names explicitly (ACCOUNTANT, seeded since Phase 8;
  // PRINCIPAL, seeded since Phase 1) — no new role needed, unlike HR/Payroll/Hostel/Transport/
  // Library, since "Admin, Accountant, Principal" was the whole access list this phase asked for.
  {
    code: "finance.master.manage",
    resource: "finance.master",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT"] as const,
  },
  {
    code: "finance.income.manage",
    resource: "finance.income",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT"] as const,
  },
  {
    code: "finance.expense.manage",
    resource: "finance.expense",
    action: "manage",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT"] as const,
  },
  {
    code: "finance.report.view",
    resource: "finance.report",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "ACCOUNTANT", "PRINCIPAL"] as const,
  },
  // Phase 15A — Communication Hub. Admin-only management (no dedicated "Communication Manager"
  // role was requested); notification.view additionally goes to PRINCIPAL for oversight, mirroring
  // finance.report.view's / library.report.view's own precedent. Marking/reading one's OWN inbox
  // notifications (mark-notification-read.service.ts, list-notifications.service.ts) predates this
  // phase and was never permission-gated — these codes are for the admin-side Communication Hub
  // (send/queue/template management, cross-tenant delivery reports), not personal inbox access.
  {
    code: "communication.manage",
    resource: "communication",
    action: "manage",
    roles: ADMIN_ROLE_CODES,
  },
  {
    code: "notification.manage",
    resource: "notification",
    action: "manage",
    roles: ADMIN_ROLE_CODES,
  },
  {
    code: "notification.view",
    resource: "notification",
    action: "view",
    roles: [...ADMIN_ROLE_CODES, "PRINCIPAL"] as const,
  },
  {
    code: "template.manage",
    resource: "template",
    action: "manage",
    roles: ADMIN_ROLE_CODES,
  },
  // Phase 16, Bundle E — Payment & Subscription Management UI. `platform.billing.manage` is
  // EduPilot's own cross-tenant platform-staff action (Platform Admin's three dashboards, School
  // Management suspend/activate, and Plan Catalog CRUD) — granted to SUPER_ADMIN ONLY, never
  // SCHOOL_ADMIN: unlike every other ADMIN_ROLE_CODES-gated code in this file, granting this to
  // SCHOOL_ADMIN would let one tenant's admin see or act on every other tenant's data, which is a
  // real security boundary, not a formality. `billing.subscription.manage` and
  // `billing.invoice.view` are the tenant-scoped counterparts — a school's own view/renew/upgrade
  // of its own subscription and its own invoice/payment/refund history — so those follow the
  // ordinary ADMIN_ROLE_CODES precedent (every mutation still takes tenantId from the caller's
  // own session, never from client input, exactly like every other tenant-scoped action).
  {
    code: "platform.billing.manage",
    resource: "platform.billing",
    action: "manage",
    roles: ["SUPER_ADMIN"] as const,
  },
  {
    code: "billing.subscription.manage",
    resource: "billing.subscription",
    action: "manage",
    roles: ADMIN_ROLE_CODES,
  },
  {
    code: "billing.invoice.view",
    resource: "billing.invoice",
    action: "view",
    roles: ADMIN_ROLE_CODES,
  },
] as const;

async function main() {
  for (const role of SYSTEM_ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      create: { code: role.code, name: role.name, isProtected: role.isProtected, scope: "SYSTEM", tenantId: null },
      update: { name: role.name, isProtected: role.isProtected },
    });
  }

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      create: { code: permission.code, resource: permission.resource, action: permission.action },
      update: { resource: permission.resource, action: permission.action },
    });
  }

  for (const permission of PERMISSIONS) {
    const permissionRow = await prisma.permission.findUniqueOrThrow({ where: { code: permission.code } });

    for (const roleCode of permission.roles) {
      const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permissionRow.id } },
        create: { roleId: role.id, permissionId: permissionRow.id },
        update: {},
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
