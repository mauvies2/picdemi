import { getActiveRole } from '@/app/[lang]/actions/roles';
import { DashboardHeader } from '@/components/dashboard-header';
import { createClient } from '@/database/server';
import { localizedRedirect } from '@/lib/i18n/redirect';
import { getCurrentCart } from './actions';
import { CartContent } from './cart-content';

export const dynamic = 'force-dynamic';

interface CartPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function CartPage({ params: routeParams, searchParams }: CartPageProps) {
  const { lang } = await routeParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return localizedRedirect(lang, '/login');
  }

  // Ensure user is in talent role
  const { activeRole } = await getActiveRole();
  if (activeRole !== 'talent') {
    return localizedRedirect(lang, '/dashboard');
  }

  const params = await searchParams;
  const status = params.status;

  // If success, redirect to profile page after a moment
  if (status === 'success') {
    return localizedRedirect(lang, '/dashboard/talent/profile?purchased=true');
  }

  const cartData = await getCurrentCart();

  return (
    <div className="space-y-6">
      <div>
        <DashboardHeader title="Shopping Cart" />
        <p className="text-sm text-muted-foreground mt-1">
          Review your selected photos before checkout.
        </p>
      </div>
      <CartContent initialCartData={cartData} />
    </div>
  );
}
