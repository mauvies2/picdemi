import { Nav } from '@/components/nav';
import { createClient } from '@/database/server';

export default async function Header({
  navDict,
}: {
  navDict: { login: string; getStarted: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <Nav user={user} navDict={navDict} />;
}
