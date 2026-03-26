import { getInitialVotesAction } from '@/app/[lang]/actions/feedback';
import { DashboardHeader } from '@/components/dashboard-header';
import { FeedbackView } from '@/components/feedback-view';

export default async function TalentFeedbackPage() {
  const initialVotes = await getInitialVotesAction();

  return (
    <div className="flex flex-1 flex-col gap-2">
      <DashboardHeader title="Share Your Feedback" />
      <p className="text-sm text-muted-foreground mb-4">
        Help us build Picdemi together — your voice shapes what we build next.
      </p>
      <FeedbackView role="talent" initialVotes={initialVotes} />
    </div>
  );
}
