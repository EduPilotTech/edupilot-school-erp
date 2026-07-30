import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAuthContext } from "@/lib/auth/auth-context";
import { requirePermission } from "@/lib/auth/rbac";
import { PrismaMessMealPlanRepository } from "@/modules/hostel/infrastructure/prisma-mess-meal-plan.repository";
import { listMessMeals } from "@/modules/hostel/application/list-mess-meals.service";
import { MessMealManager } from "@/components/features/hostel/MessMealManager";

interface MealPlanDetailPageProps {
  params: Promise<{ planId: string }>;
}

export default async function MealPlanDetailPage({ params }: MealPlanDetailPageProps) {
  const authContext = await requireAuthContext();
  await requirePermission("hostel.mess.manage");

  const { planId } = await params;
  const planRepository = new PrismaMessMealPlanRepository();
  const plan = await planRepository.findById(authContext.tenantId, planId);
  if (!plan) notFound();

  const meals = await listMessMeals({ tenantId: authContext.tenantId }, planId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href={`/hostel/mess?hostelId=${plan.hostelId}`} className="text-sm text-blue-600 hover:underline">
        ← Mess Management
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-zinc-900">{plan.name}</h1>
      {plan.description && <p className="mt-1 text-sm text-zinc-500">{plan.description}</p>}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Meals</h2>
        <div className="mt-3">
          <MessMealManager mealPlanId={planId} items={meals} canManage />
        </div>
      </section>
    </main>
  );
}
