// The single, hand-maintained source of truth for the app shell's sidebar navigation — every
// href and permission code below was confirmed by reading the actual top-level page.tsx for
// that module (its real `requirePermission("...")` call, or its absence), not guessed. See the
// Phase 17 report for the exact grep evidence per item. `permission: null` means the module's
// own top-level page has no explicit gate beyond requireAuthContext() (just an authenticated,
// ACTIVE tenant member) — matching every hub page's own `LINKS` array pattern in this codebase
// (app/hostel/page.tsx, app/hr/page.tsx, etc.), where the hub itself is unguarded and only its
// individual links are permission-filtered.
//
// app/dashboard/page.tsx reuses this same array for its own card grid, so this is the one place
// that list is maintained — not duplicated between the sidebar and the dashboard.

export interface NavItem {
  href: string;
  label: string;
  description: string;
  permission: string | null;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", description: "Your EduPilot home", permission: null }],
  },
  {
    title: "Academics",
    items: [
      { href: "/students", label: "Students", description: "Admissions, profiles, and records", permission: null },
      { href: "/students/new", label: "New Admission", description: "Admit a new student", permission: null },
      { href: "/academics/sessions", label: "Academic Sessions", description: "Academic years (e.g. 2026-2027)", permission: "academic-session.view" },
      { href: "/academics/classes", label: "Classes", description: "Classes within an academic session", permission: "class.view" },
      { href: "/academics/sections", label: "Sections", description: "Sections within a class", permission: "section.view" },
      { href: "/teachers", label: "Teachers", description: "Teaching staff records", permission: "teacher.view" },
      { href: "/academics/subjects", label: "Subjects", description: "Subject master list", permission: "subject.view" },
      { href: "/academics/classrooms", label: "Classrooms", description: "Physical rooms and labs", permission: "classroom.view" },
      { href: "/attendance", label: "Attendance", description: "Daily student attendance", permission: null },
      { href: "/timetable", label: "Timetable", description: "Class timetables", permission: null },
      { href: "/examinations", label: "Examinations", description: "Exams, marks, results, report cards", permission: null },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/fees", label: "Fees", description: "Fee setup, billing, and collection", permission: null },
      { href: "/finance", label: "Finance", description: "Accounts, income, and expenses", permission: null },
      { href: "/billing", label: "Billing", description: "Your school's subscription and invoices", permission: null },
      { href: "/billing/subscription", label: "Subscription", description: "Current plan, renew, and upgrade", permission: "billing.subscription.manage" },
    ],
  },
  {
    title: "People",
    items: [
      { href: "/hr", label: "HR", description: "Employees, leave, and performance", permission: null },
      { href: "/payroll", label: "Payroll", description: "Salary structures and payroll runs", permission: null },
      { href: "/employee-portal", label: "Employee Portal", description: "Your own staff self-service", permission: "employee.portal.access" },
    ],
  },
  {
    title: "Campus Life",
    items: [
      { href: "/library", label: "Library", description: "Books, issue, return, and reservations", permission: null },
      { href: "/transport", label: "Transport", description: "Vehicles, routes, and assignments", permission: null },
      { href: "/hostel", label: "Hostel", description: "Rooms, beds, and student assignment", permission: null },
    ],
  },
  {
    title: "Engagement",
    items: [
      { href: "/communication", label: "Communication", description: "Homework, notices, calendar, messages", permission: null },
      { href: "/notification/history", label: "Notifications", description: "Every notification sent, with delivery status", permission: "notification.view" },
      { href: "/parent", label: "Parent Portal", description: "Your children's attendance, fees, and results", permission: "parent.dashboard.view" },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/settings/users", label: "Settings", description: "Users, roles, and school configuration", permission: null },
      { href: "/settings/branding", label: "Branding", description: "Logo, letterhead, theme color, and social links", permission: "school.branding.view" },
      { href: "/platform", label: "Platform Admin", description: "EduPilot's own cross-tenant operations", permission: "platform.billing.manage" },
    ],
  },
];
