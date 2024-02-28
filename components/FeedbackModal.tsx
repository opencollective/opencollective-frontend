import React from 'react';
import { useMutation } from '@apollo/client';
import { DialogClose } from '@radix-ui/react-dialog';
import { Form, Formik } from 'formik';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';

import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/Dialog';
import { Textarea } from './ui/Textarea';
import { toast } from './ui/useToast';
import { sendSurveyResponseMutation } from './Survey';

export enum FEEDBACK_KEY {
  HOST_TRANSACTIONS = 'HOST_TRANSACTIONS',
  GENERAL_FEEDBACK = 'GENERAL_FEEDBACK',
  DASHBOARD = 'DASHBOARD',
  COLLECTIVE_OVERVIEW = 'COLLECTIVE_OVERVIEW',
}

export function FeedbackModal({
  feedbackKey = FEEDBACK_KEY.GENERAL_FEEDBACK,
  title = <FormattedMessage defaultMessage="Provide feedback" />,
  description = <FormattedMessage defaultMessage="How is your experience? What can be improved?" />,
  placeholder = '',
  open,
  setOpen,
}: {
  feedbackKey: FEEDBACK_KEY;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  placeholder?: string;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { LoggedInUser } = useLoggedInUser();
  //   const [open, setOpen] = React.useState(false);
  const [sendInAppSurveyResponse, { loading }] = useMutation(sendSurveyResponseMutation, {
    context: API_V2_CONTEXT,
    variables: {
      score: -1, // the sendSurveyResponse mutation requires a score, but we don't use it here
      surveyKey: feedbackKey,
      responseId: self.crypto.randomUUID(), // the Survey component uses this to send multiple responses and have it update the same row in Coda, but here we only send one response
    },
  });

  if (!LoggedInUser) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <React.Fragment>
          <div className="flex flex-col gap-4">
            <Formik
              initialValues={{
                text: '',
                okToContact: false,
              }}
              onSubmit={async values => {
                try {
                  await sendInAppSurveyResponse({ variables: values });
                  setOpen(false);
                  toast({ message: 'Thank you for your feedback!', variant: 'success' });
                } catch (error) {
                  toast({ message: error.message, variant: 'error' });
                }
              }}
            >
              {formik => (
                <Form className="flex w-full flex-1 flex-col gap-4">
                  <Textarea
                    value={formik.values.text}
                    onChange={e => formik.setFieldValue('text', e.target.value)}
                    placeholder={placeholder}
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="okToContact"
                      checked={formik.values.okToContact}
                      onCheckedChange={checked => formik.setFieldValue('okToContact', checked)}
                    />
                    <label
                      htmlFor="okToContact"
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      <FormattedMessage defaultMessage="It's OK to contact me for follow up questions." />
                    </label>
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">
                        <FormattedMessage id="Close" defaultMessage="Close" />
                      </Button>
                    </DialogClose>
                    <Button type="submit" loading={loading} disabled={loading}>
                      <FormattedMessage id="submit" defaultMessage="Submit" />
                    </Button>
                  </DialogFooter>
                </Form>
              )}
            </Formik>
          </div>
        </React.Fragment>
      </DialogContent>
    </Dialog>
  );
}
