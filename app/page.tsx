import { redirect } from 'next/navigation';

// The proxy handles locale detection and redirects before this page ever renders.
// This is a safety-net only.
export default function RootPage() {
  redirect('/es');
}
