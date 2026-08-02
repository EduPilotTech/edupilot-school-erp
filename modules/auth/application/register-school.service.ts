import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { PrismaUserProfileRepository } from "@/modules/users/infrastructure/prisma-user-profile.repository";
import { PrismaUserRoleRepository } from "@/modules/users/infrastructure/prisma-user-role.repository";
import { PrismaRoleRepository } from "@/modules/users/infrastructure/prisma-role.repository";
import {
  createAuthUserWithPassword,
  deleteAuthUser,
  setUserTenantMetadata,
} from "../infrastructure/supabase-admin-user.adapter";
import type { AuthError, AuthResult } from "./sign-in.service";

// Phase 17 — the one missing piece that made every other page unreachable: nothing in this
// codebase could create a tenant's first Tenant/School/UserProfile row (prisma/seed.ts
// deliberately never seeds customer data, and `inviteUser` requires an already-existing
// tenant+admin to call it — a genuine chicken-and-egg gap, confirmed by a direct query against
// the live dev database returning zero Tenant/School/UserProfile rows). This service is that
// bootstrap path: a school signing itself up, becoming its own first SCHOOL_ADMIN.
//
// Deliberately reuses existing repositories rather than writing new persistence logic:
// PrismaUserProfileRepository.create/updateStatus and PrismaUserRoleRepository.create are the
// exact same methods invite-user.service.ts and assign-role.service.ts already use — this
// service only orchestrates them in a sequence neither of those services was built for (there is
// no existing actor to invite/assign on behalf of, because this user IS the first one).
// Tenant/School creation has no existing repository anywhere in this codebase to reuse (no
// modules/tenancy exists yet — see the Phase 16 Architecture Review's own note on this gap) — a
// direct `prisma` write for exactly these two root rows is the same pattern
// subscription.service.ts/school-activation.service.ts already use for the one write case a
// tenant-scoped repository structurally can't cover (there is no tenant to scope a Tenant-table
// write by, since the write IS what creates the tenant).

const registerSchoolSchema = z.object({
  schoolName: z.string().trim().min(2, "School name is required.").max(200),
  registrationNumber: z.string().trim().min(1, "Registration number is required.").max(100),
  board: z.enum(["CBSE", "ICSE", "STATE_BOARD", "IB", "IGCSE", "OTHER"]),
  principalName: z.string().trim().min(1, "Principal name is required.").max(200),
  schoolEmail: z.string().trim().toLowerCase().email("Enter a valid school email address."),
  schoolPhone: z.string().trim().min(6, "Enter a valid phone number.").max(20),
  address: z.string().trim().min(1, "Address is required.").max(500),
  city: z.string().trim().min(1, "City is required.").max(100),
  district: z.string().trim().min(1, "District is required.").max(100),
  state: z.string().trim().min(1, "State is required.").max(100),
  country: z.string().trim().min(1, "Country is required.").max(100).default("India"),
  postalCode: z.string().trim().min(1, "Postal code is required.").max(20),
  adminFullName: z.string().trim().min(1, "Your full name is required.").max(200),
  adminEmail: z.string().trim().toLowerCase().email("Enter a valid email address."),
  adminPassword: z.string().min(8, "Password must be at least 8 characters."),
});

export type RegisterSchoolInput = z.infer<typeof registerSchoolSchema>;

export interface RegisterSchoolResult {
  tenantId: string;
  userId: string;
}

const SCHOOL_ADMIN_ROLE_CODE = "SCHOOL_ADMIN";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function generateUniqueSlug(schoolName: string): Promise<string> {
  const base = slugify(schoolName) || "school";
  let candidate = base;
  let suffix = 0;

  // Practically always resolves on the first try — collisions only arise when two schools share
  // a near-identical name, so a short numeric suffix (not a random one) keeps slugs readable.
  while (await prisma.tenant.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

function toAuthError(message: string): AuthError {
  return { code: "UNKNOWN_ERROR", message };
}

// Creates the Supabase Auth account, then the Tenant/School (one transaction — neither has an
// existing repository, and both are meaningless without the other), then the UserProfile
// (reusing PrismaUserProfileRepository.create + updateStatus, since a self-registering admin is
// ACTIVE immediately, not INVITED — the repository's create() has no way to set status directly,
// mirroring every other tenant-scoped create() in this codebase), then the SCHOOL_ADMIN role
// assignment (reusing PrismaUserRoleRepository.create directly rather than
// assign-role.service.ts's assignRole(), which explicitly blocks a user from self-assigning a
// protected role — the correct guard for an existing admin promoting someone, but not applicable
// here: this user IS the tenant's first and only actor).
//
// Best-effort cleanup on any failure after the Supabase Auth user exists — a partially-created
// tenant would otherwise permanently block retrying registration with the same email.
export async function registerSchool(input: unknown): Promise<AuthResult<RegisterSchoolResult>> {
  const parsed = registerSchoolSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input." } };
  }
  const data = parsed.data;

  const existingTenantForEmail = await prisma.userProfile.findFirst({ where: { email: data.adminEmail } });
  if (existingTenantForEmail) {
    return { success: false, error: { code: "VALIDATION_ERROR", message: "An account with this email already exists." } };
  }

  const authResult = await createAuthUserWithPassword(data.adminEmail, data.adminPassword, {
    full_name: data.adminFullName,
  });
  if (!authResult.success) {
    return { success: false, error: toAuthError(authResult.message) };
  }
  const authUserId = authResult.data.authUserId;

  let tenantId: string | null = null;

  try {
    const slug = await generateUniqueSlug(data.schoolName);

    const created = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.schoolName,
          slug,
          timezone: "Asia/Kolkata",
          locale: "en-IN",
          currency: "INR",
        },
      });

      await tx.school.create({
        data: {
          tenantId: tenant.id,
          schoolName: data.schoolName,
          registrationNumber: data.registrationNumber,
          board: data.board,
          principalName: data.principalName,
          email: data.schoolEmail,
          phone: data.schoolPhone,
          address: data.address,
          city: data.city,
          district: data.district,
          state: data.state,
          country: data.country,
          postalCode: data.postalCode,
        },
      });

      return tenant;
    });

    tenantId = created.id;

    // Completion Pass — Storage RLS verification (checklist #14): tenantId doesn't exist until
    // this transaction commits, so this is a necessary follow-up call, not something
    // createAuthUserWithPassword could have done itself. Best-effort is NOT acceptable here (an
    // admin without this claim can never satisfy a tenant-scoped Storage policy), so a failure
    // here falls into the same catch block as everything else below and rolls back like any
    // other step.
    await setUserTenantMetadata(authUserId, created.id);

    const userProfileRepository = new PrismaUserProfileRepository();
    const profile = await userProfileRepository.create({
      id: authUserId,
      tenantId: created.id,
      fullName: data.adminFullName,
      email: data.adminEmail,
      createdBy: null,
    });
    await userProfileRepository.updateStatus(created.id, profile.id, "ACTIVE", profile.id);

    const roleRepository = new PrismaRoleRepository();
    const schoolAdminRole = await roleRepository.findByCode(SCHOOL_ADMIN_ROLE_CODE);
    if (!schoolAdminRole) {
      throw new Error(`System role "${SCHOOL_ADMIN_ROLE_CODE}" is not seeded — run the RBAC seed before registering a school.`);
    }

    const userRoleRepository = new PrismaUserRoleRepository();
    await userRoleRepository.create({
      tenantId: created.id,
      userId: profile.id,
      roleId: schoolAdminRole.id,
      createdBy: profile.id,
    });

    return { success: true, data: { tenantId: created.id, userId: profile.id } };
  } catch (error) {
    if (tenantId) {
      await prisma.school.deleteMany({ where: { tenantId } }).catch(() => {});
      await prisma.userProfile.deleteMany({ where: { tenantId } }).catch(() => {});
      await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => {});
    }
    await deleteAuthUser(authUserId).catch(() => {});

    return {
      success: false,
      error: toAuthError(error instanceof Error ? error.message : "Could not complete registration. Please try again."),
    };
  }
}
