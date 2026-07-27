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
] as const;

// Only the 9 permission codes actually referenced by working code in this codebase today
// (modules/users' application services and app/settings/users/actions.ts) — not the
// illustrative future codes from Sprint 1B's design sketch (student.create, attendance.mark,
// etc.). Seeding permissions for features that don't exist yet would be seeding ahead of the
// code, not verifying against it — see Sprint 3 — Step 5 Part C.
const PERMISSIONS = [
  { code: "user.invite", resource: "user", action: "invite" },
  { code: "user.update", resource: "user", action: "update" },
  { code: "user.suspend", resource: "user", action: "suspend" },
  { code: "user.activate", resource: "user", action: "activate" },
  { code: "user.deactivate", resource: "user", action: "deactivate" },
  { code: "user.delete", resource: "user", action: "delete" },
  { code: "user.restore", resource: "user", action: "restore" },
  { code: "role.assign", resource: "role", action: "assign" },
  { code: "role.remove", resource: "role", action: "remove" },
] as const;

// Only Super Admin and School Admin hold the current user-management permission set — every
// other system role is a non-administrative staff/portal role with none of these grants.
const ADMIN_ROLE_CODES = ["SUPER_ADMIN", "SCHOOL_ADMIN"] as const;

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
      create: permission,
      update: { resource: permission.resource, action: permission.action },
    });
  }

  for (const roleCode of ADMIN_ROLE_CODES) {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });

    for (const permission of PERMISSIONS) {
      const permissionRow = await prisma.permission.findUniqueOrThrow({
        where: { code: permission.code },
      });

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
