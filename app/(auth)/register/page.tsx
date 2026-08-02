import Link from "next/link";
import { RegisterSchoolForm } from "@/components/features/auth/RegisterSchoolForm";

// Deliberately does NOT call requireAuthContext()/requireSession() — this page must be
// reachable while anonymous, since registering a school is how a tenant's very first user gets
// in at all.
export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Register your school</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Create your school&apos;s EduPilot account. You&apos;ll be signed in as the school admin.
        </p>

        <div className="mt-6">
          <RegisterSchoolForm />
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
