import React from 'react';
import { useMutation } from '@apollo/client';
import * as ToastPrimitives from '@radix-ui/react-toast';
import ReactAnimateHeight from 'react-animate-height';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';

import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { Textarea } from './ui/Textarea';

export enum SURVEY_KEY {
  EXPENSE_SUBMITTED = 'EXPENSE_SUBMITTED',
  EXPENSE_SUBMITTED_NEW_FLOW = 'EXPENSE_SUBMITTED_NEW_FLOW',
  CONTRIBUTION_COMPLETED = 'CONTRIBUTION_COMPLETED',
}

export const sendSurveyResponseMutation = gql`
  mutation SendSurveyResponse(
    $surveyKey: String!
    $responseId: String!
    $score: Int!
    $text: String
    $okToContact: Boolean
  ) {
    sendSurveyResponse(
      surveyKey: $surveyKey
      responseId: $responseId
      score: $score
      text: $text
      okToContact: $okToContact
    )
  }
`;

export function Survey({
  surveyKey,
  question = <FormattedMessage defaultMessage="How was your experience?" />,
  followUpQuestion = <FormattedMessage defaultMessage="Thanks! How could it be improved?" />,
  hasParentTitle = false,
}: {
  surveyKey: SURVEY_KEY;
  question?: string | React.ReactNode;
  followUpQuestion?: string | React.ReactNode;
  hasParentTitle?: boolean;
}) {
  const { LoggedInUser } = useLoggedInUser();
  const [sendInAppSurveyResponse] = useMutation(sendSurveyResponseMutation, { context: API_V2_CONTEXT });
  const [score, setScore] = React.useState(null);
  const [text, setText] = React.useState('');
  const [completed, setCompleted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [okToContact, setOkToContact] = React.useState(false);
  const textarea = React.useRef(null);
  const responseId = React.useMemo(() => self.crypto.randomUUID(), []);
  const showForm = score !== null;

  const sendResponse = async ({ surveyKey, responseId, score, text, okToContact }) => {
    setLoading(true);
    try {
      await sendInAppSurveyResponse({ variables: { surveyKey, responseId, score, text, okToContact } });
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const submit = async e => {
    e.preventDefault();
    try {
      await sendResponse({ surveyKey, responseId, score, text, okToContact });
      setCompleted(true);
    } catch (error) {
      setError(error.message);
    }
  };

  React.useEffect(() => {
    if (showForm) {
      setTimeout(() => textarea.current.focus(), 150);
    }
  }, [showForm]);

  if (!LoggedInUser) {
    return null;
  }

  return (
    <React.Fragment>
      <ReactAnimateHeight duration={150} height={completed ? 0 : 'auto'}>
        <div className="flex flex-col gap-4">
          <p className={hasParentTitle ? 'font-normal' : 'font-bold'}>{question}</p>
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              {['😫', '😕', '😐', '🙂', '😀'].map((emoji, i) => (
                <Button
                  key={emoji}
                  size="icon"
                  variant={i === score ? 'default' : 'outline'}
                  onClick={async e => {
                    e.preventDefault();
                    setScore(i);
                    await sendResponse({ surveyKey, responseId, score: i, text, okToContact });
                  }}
                  className="text-xl"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>

          <ReactAnimateHeight duration={150} height={showForm ? 'auto' : 0}>
            <form className="flex w-full flex-1 flex-col gap-4" onSubmit={submit}>
              <p className="text-muted-foreground">{followUpQuestion}</p>

              <Textarea ref={textarea} value={text} onChange={e => setText(e.target.value)} />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="okToContact"
                  checked={okToContact}
                  onCheckedChange={checked => setOkToContact(Boolean(checked))}
                />
                <label
                  htmlFor="okToContact"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  <FormattedMessage defaultMessage="It's OK to contact me for follow up questions." />
                </label>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  <FormattedMessage id="submit" defaultMessage="Submit" />
                </Button>
                <ToastPrimitives.Close asChild>
                  <Button variant="ghost">
                    <FormattedMessage id="Close" defaultMessage="Close" />
                  </Button>
                </ToastPrimitives.Close>
              </div>
              {error && <p className="text-red-600">{error}</p>}
            </form>
          </ReactAnimateHeight>
        </div>
      </ReactAnimateHeight>

      <ReactAnimateHeight duration={150} height={completed ? 'auto' : 0}>
        {completed && (
          <p className="text-muted-foreground">
            <FormattedMessage defaultMessage="Thank you for your feedback! It will help us improve Open Collective." />
          </p>
        )}
      </ReactAnimateHeight>
    </React.Fragment>
  );
}
