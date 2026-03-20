import { Nav } from '@/components/nav';
import { createClient } from '@/database/server';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <Nav user={user} />;
}
