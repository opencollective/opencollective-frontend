import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { DialogClose } from '@radix-ui/react-dialog';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import { Account, AccountWithContributions, AccountWithParent } from '../../../../lib/graphql/types/v2/graphql';
import { getDashboardRoute } from '../../../../lib/url-helpers';

import { getI18nLink } from '../../../I18nFormatters';
import Image from '../../../Image';
import Link from '../../../Link';
import MessageBox from '../../../MessageBox';
import RichTextEditor from '../../../RichTextEditor';
import StyledInputField from '../../../StyledInputField';
import { Button } from '../../../ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../ui/Dialog';
import { useToast } from '../../../ui/useToast';

const startResumeContributionsProcess = gql`
  mutation StartResumeContributionsProcess($account: AccountReferenceInput!, $message: String) {
    startResumeOrdersProcess(account: $account, message: $message) {
      id
      ... on AccountWithContributions {
        canStartResumeContributionsProcess
        hasResumeContributionsProcessStarted
      }
    }
  }
`;

export const PausedIncomingContributionsMessage = ({
  account,
  count,
}: {
  account: Account & AccountWithContributions & AccountWithParent;
  count: number;
}) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [message, setMessage] = React.useState('');
  const [resumeContributionsProcess, { loading }] = useMutation(startResumeContributionsProcess, {
    context: API_V2_CONTEXT,
  });

  const msgType = account.hasResumeContributionsProcessStarted ? 'info' : 'warning';
  return (
    <MessageBox
      type={msgType}
      alignIcon="center"
      icon={
        <Image
          alt=""
          width={32}
          height={32}
          src={
            msgType === 'warning'
              ? '/static/images/illustrations/eye-warning.png'
              : '/static/images/illustrations/eye.png'
          }
        />
      }
    >
      <strong>
        <FormattedMessage
          defaultMessage="{collective} holds {count, plural, one {an incoming recurring contribution that is currently paused} other {# incoming recurring contributions that are currently paused}}."
          values={{ count, collective: account.name }}
        />
      </strong>
      {account.hasResumeContributionsProcessStarted ? (
        <p>
          <FormattedMessage defaultMessage="You have started the process to resume these contributions, contributors will receive a few reminders to resume their contributions. If they don't, these contributions will automatically expire after a few months." />
        </p>
      ) : !account.canStartResumeContributionsProcess ? (
        <p>
          <FormattedMessage
            defaultMessage="These contributions can't be resumed yet. You need to either find a Fiscal Host or become an Independent Collective. <LearnMoreLink>Learn more</LearnMoreLink>"
            values={{ LearnMoreLink: getI18nLink({ as: Link, href: getDashboardRoute(account, 'host') }) }}
          />
        </p>
      ) : account.parent ? (
        <p>
          <FormattedMessage
            defaultMessage="The process to resume contributions can only be started from the <Link>Parent Collective</Link>."
            values={{
              Link: getI18nLink({ as: Link, href: getDashboardRoute(account.parent, 'incoming-contributions') }),
            }}
          />
        </p>
      ) : (
        <Dialog>
          <p>
            <FormattedMessage
              defaultMessage="These contributions are ready to be resumed. <ResumeLink>Click here</ResumeLink> to start this process."
              values={{ ResumeLink: msg => <DialogTrigger className="underline">{msg}</DialogTrigger> }}
            />
          </p>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="mb-4">
                <FormattedMessage defaultMessage="Ask your Contributors to resume their contributions" />
              </DialogTitle>
              <DialogDescription>
                <FormattedMessage defaultMessage="Your contributors will be notified with a link to easily resume their contributions. We will also send a few periodic reminders, in case they miss the first email." />
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={e => {
                e.preventDefault();
                resumeContributionsProcess({ variables: { account: { id: account.id }, message } })
                  .then(() => {
                    toast({
                      variant: 'success',
                      message: intl.formatMessage({ defaultMessage: 'Resume contributions process started.' }),
                    });
                  })
                  .catch(e => {
                    toast({
                      variant: 'error',
                      message: i18nGraphqlException(intl, e),
                    });
                  });
              }}
            >
              <div className="mt-4">
                <StyledInputField
                  name="messageForContributors"
                  labelProps={{ fontWeight: 'bold' }}
                  label={intl.formatMessage({ defaultMessage: 'Additional message for contributors' })}
                  required={false}
                >
                  {field => (
                    <RichTextEditor
                      id={field.id}
                      inputName={field.name}
                      showCount
                      defaultValue={message}
                      version="simplified"
                      onChange={e => setMessage(e.target.value)}
                      editorMaxHeight={300}
                      withBorders
                      editorMinHeight={150}
                      maxLength={2000}
                      placeholder={intl.formatMessage({
                        defaultMessage: 'Hey Folks, we are back and ready to receive your contributions again!',
                      })}
                    />
                  )}
                </StyledInputField>
              </div>
              <DialogFooter className="mt-4">
                <DialogClose>
                  <Button type="button" variant="outline">
                    <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                  </Button>
                </DialogClose>
                <Button type="submit" loading={loading}>
                  <FormattedMessage defaultMessage="Start the Resuming Process" />
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </MessageBox>
  );
};
