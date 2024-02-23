import React from 'react';
import { Megaphone, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import { HELP_MESSAGE } from '../../../../lib/constants/dismissable-help-message';

import DismissibleMessage from '../../../DismissibleMessage';
import { FEEDBACK_KEY, FeedbackModal } from '../../../FeedbackModal';
import Image from '../../../Image';
import { Alert, AlertDescription, AlertTitle } from '../../../ui/Alert';
import { Button } from '../../../ui/Button';
import DashboardHeader from '../../DashboardHeader';
import type { DashboardSectionProps } from '../../types';

import { Timeline } from './Timeline';

const Home = ({ accountSlug }: DashboardSectionProps) => {
  const router = useRouter();
  const [showFeedbackModal, setShowFeedbackModal] = React.useState(false);
  const slug = router.query?.as || accountSlug;

  return (
    <div className="flex max-w-screen-lg flex-col-reverse xl:flex-row">
      <div className="flex flex-1 flex-col gap-4">
        <DashboardHeader
          title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
          description={
            <FormattedMessage
              id="Dashboard.Home.Subtitle"
              defaultMessage="The latest news and updates you need to know in Open Collective."
            />
          }
        />
        <Timeline accountSlug={slug} withFilter />
      </div>
      <div className="xl:ml-8 xl:w-64">
        <DismissibleMessage messageId={HELP_MESSAGE.WELCOME_TO_DASHBOARD}>
          {({ dismiss }) => (
            <Alert className="relative mb-8 flex items-start gap-4 fade-in">
              <Image
                className="block h-12 w-12 xl:hidden"
                alt="Illustration of plant"
                width={48}
                height={48}
                src="/static/images/dashboard.png"
              />
              <div>
                <div className="mb-2 flex items-start gap-3">
                  <Image
                    className="hidden h-12 w-12 xl:block"
                    alt="Illustration of plant"
                    width={48}
                    height={48}
                    src="/static/images/dashboard.png"
                  />
                  <AlertTitle className="text-lg leading-tight">
                    <FormattedMessage id="Dashboard.Banner.Title" defaultMessage="Welcome to your new dashboard" />
                  </AlertTitle>
                </div>

                <AlertDescription className="mt-1 max-w-prose">
                  <p>
                    <FormattedMessage
                      id="Dashboard.Banner.Description"
                      defaultMessage="We’ve created this space for you to keep on top of everything you do in Open Collective, from tracking your expenses to managing organizations."
                    />
                  </p>
                </AlertDescription>
                <Button variant="outline" className="mt-2 gap-2  xl:w-full" onClick={() => setShowFeedbackModal(true)}>
                  <Megaphone size={16} />
                  <FormattedMessage id="GiveFeedback" defaultMessage="Give feedback" />
                </Button>
              </div>

              <button
                className="absolute right-1 top-1 rounded-full p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                onClick={dismiss}
              >
                <X size={16} />
              </button>
            </Alert>
          )}
        </DismissibleMessage>
      </div>
      <FeedbackModal open={showFeedbackModal} setOpen={setShowFeedbackModal} feedbackKey={FEEDBACK_KEY.DASHBOARD} />
    </div>
  );
};

export default Home;
