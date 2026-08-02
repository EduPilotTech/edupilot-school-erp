import Link from "next/link";
import { LoginForm } from "@/components/features/auth/LoginForm";

// Deliberately does NOT call requireAuthContext()/requireSession() — this page must be
// reachable while anonymous (that's the entire point of a login page). proxy.ts already
// redirects an already-authenticated user away from /login to /dashboard before this ever
// renders, but that redirect is a UX convenience only, not the reason this page stays anonymous.
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Sign in to EduPilot</h1>
        <p className="mt-1 text-sm text-zinc-500">Enter your email and password to continue.</p>

        <div className="mt-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          New school?{" "}
          <Link href="/register" className="font-medium text-blue-600 hover:underline">
            Register your school
          </Link>
        </p>
      </div>
    </main>
  );
}
