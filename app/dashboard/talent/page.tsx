import { redirect } from 'next/navigation';

// Overview section hidden — talent lands on explore page instead
export default function TalentDashboardPage() {
  redirect('/dashboard/talent/events');
}
