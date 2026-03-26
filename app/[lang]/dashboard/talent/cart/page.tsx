import { getActiveRole } from '@/app/[lang]/actions/roles';
import { DashboardHeader } from '@/components/dashboard-header';
import { createClient } from '@/database/server';
import { type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
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
  const dict = await getDictionary(lang as Locale);
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
        <DashboardHeader title={dict.talentDashboard.shoppingCart} />
        <p className="text-sm text-muted-foreground mt-1">
          {dict.talentDashboard.reviewPhotos}
        </p>
      </div>
      <CartContent initialCartData={cartData} />
    </div>
  );
}
