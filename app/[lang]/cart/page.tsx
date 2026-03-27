import { Suspense } from 'react';
import { type Locale } from '@/lib/i18n/config';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { GuestCartContent } from './guest-cart-content';

export default async function GuestCartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="mx-auto max-w-7xl py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold">{dict.cart.shoppingCart}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {dict.cart.reviewPhotos}
        </p>
      </div>
      <Suspense>
        <GuestCartContent />
      </Suspense>
    </div>
  );
}
