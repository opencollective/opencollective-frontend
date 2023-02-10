import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { Form, Formik } from 'formik';
import { FormattedMessage } from 'react-intl';

import { IGNORED_TAGS } from '../lib/constants/collectives';
import { API_V2_CONTEXT, gqlV1 } from '../lib/graphql/helpers';
import { Collective } from '../lib/graphql/types/v2/graphql';

import CollectiveTagsInput from './CollectiveTagsInput';
import { Flex } from './Grid';
import MessageBox from './MessageBox';
import StyledButton from './StyledButton';
import StyledInputFormikField from './StyledInputFormikField';
import StyledModal, { ModalBody, ModalFooter, ModalHeader } from './StyledModal';
import { TOAST_TYPE, useToasts } from './ToastProvider';

const editTagsMutation = gqlV1`
  mutation editCollective(
    $collective: CollectiveInputType!
  ) {
    editCollective(
      collective: $collective
    ) {
      id
      tags
    }
  }
`;

const tagStatsQuery = gql`
  query tagStats($host: AccountReferenceInput) {
    tagStats(host: $host, limit: 5) {
      nodes {
        id
        tag
      }
    }
  }
`;

export type EditTagsModalProps = {
  collective: Collective;
  onClose: () => void;
};

export default function EditTagsModal({ collective, onClose }: EditTagsModalProps) {
  const { addToast } = useToasts();
  const [editTags, { loading }] = useMutation(editTagsMutation);

  const { data: { tagStats } = { tagStats: null } } = useQuery(tagStatsQuery, {
    variables: { ...(collective.host?.slug ? { host: { slug: collective.host.slug } } : {}) },
    context: API_V2_CONTEXT,
  });

  const initialValues = {
    tags: collective.tags,
  };

  const submit = async values => {
    const { tags } = values;
    try {
      const variables = {
        collective: {
          id: collective.id,
          tags: tags,
        },
      };

      await editTags({ variables });
    } catch (e) {
      addToast({
        type: TOAST_TYPE.ERROR,
        message: (
          <FormattedMessage
            defaultMessage="Error submiting form: {error}"
            values={{
              error: e.message,
            }}
          />
        ),
      });
      return;
    }
    addToast({
      type: TOAST_TYPE.SUCCESS,
      message: <FormattedMessage defaultMessage="Successfully updated tags" />,
    });
    handleClose();
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <StyledModal flexGrow={1} maxWidth="500px" onClose={handleClose} trapFocus>
      <Formik initialValues={initialValues} onSubmit={submit}>
        {formik => (
          <Form onSubmit={formik.handleSubmit}>
            {/* A hack to disable automatic focus from Formik on the tags input.  */}
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
            <div tabIndex={0} />
            <ModalHeader onClose={handleClose} hideCloseIcon={true}>
              <FormattedMessage defaultMessage="Edit tags" />
            </ModalHeader>
            <ModalBody mb={0}>
              <StyledInputFormikField
                name="tags"
                htmlFor="tags"
                labelProps={{ fontWeight: 500, fontSize: '14px', lineHeight: '17px' }}
              >
                {({ field }) => {
                  return (
                    <CollectiveTagsInput
                      {...field}
                      defaultValue={formik.values.tags}
                      onChange={tags => {
                        formik.setFieldValue(
                          'tags',
                          tags.map(t => t.value.toLowerCase()),
                        );
                      }}
                      suggestedTags={tagStats?.nodes?.map(node => node.tag).filter(tag => !IGNORED_TAGS.includes(tag))}
                    />
                  );
                }}
              </StyledInputFormikField>
              <MessageBox type="info" mt={3}>
                <FormattedMessage
                  id="collective.tags.info"
                  defaultMessage="Tags help you improve your group’s discoverability and connect with similar initiatives across the world."
                />
              </MessageBox>
            </ModalBody>
            <ModalFooter isFullWidth>
              <Flex justifyContent="flex-start" flexWrap="wrap" gap="16px">
                <StyledButton
                  minWidth={132}
                  buttonStyle="primary"
                  loading={loading}
                  disabled={!formik.dirty}
                  type="submit"
                >
                  <FormattedMessage id="save" defaultMessage="Save" />
                </StyledButton>
                <StyledButton
                  minWidth={132}
                  buttonStyle="secondary"
                  disabled={loading}
                  type="button"
                  onClick={handleClose}
                >
                  <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
                </StyledButton>
              </Flex>
            </ModalFooter>
          </Form>
        )}
      </Formik>
    </StyledModal>
  );
}
