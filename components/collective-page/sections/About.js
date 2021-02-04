import React from 'react';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { CollectiveType } from '../../../lib/constants/collectives';

import Container from '../../Container';
import { Flex } from '../../Grid';
import HTMLContent, { isEmptyValue } from '../../HTMLContent';
import InlineEditField from '../../InlineEditField';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import { Span } from '../../Text';
import ContainerSectionContent from '../ContainerSectionContent';
import { editCollectiveLongDescriptionMutation } from '../graphql/mutations';

// Dynamicly load HTMLEditor to download it only if user can edit the page
const HTMLEditorLoadingPlaceholder = () => <LoadingPlaceholder height={400} />;
const HTMLEditor = dynamic(() => import('../../RichTextEditor'), {
  loading: HTMLEditorLoadingPlaceholder,
  ssr: false, // No need for SSR as user needs to be logged in
});

const messages = defineMessages({
  placeholder: {
    id: 'CollectivePage.AddLongDescription',
    defaultMessage: 'Add a description',
  },
});

/**
 * About section category with editable description
 */
const SectionAbout = ({ collective, canEdit, intl }) => {
  const isEmptyDescription = isEmptyValue(collective.longDescription);
  const isCollective = collective.type === CollectiveType.COLLECTIVE;
  const isFund = collective.type === CollectiveType.FUND;
  canEdit = collective.isArchived ? false : canEdit;

  return (
    <ContainerSectionContent px={2} pb={5}>
      <Container width="100%" maxWidth={700} margin="0 auto" mt={4}>
        <InlineEditField
          mutation={editCollectiveLongDescriptionMutation}
          values={collective}
          field="longDescription"
          canEdit={canEdit}
          topEdit={-20}
          showEditIcon={!isEmptyDescription}
          formatBeforeSubmit={v => (isEmptyValue(v) ? null : v)}
          prepareVariables={(collective, longDescription) => ({
            id: collective.id,
            longDescription: isEmptyValue(longDescription) ? null : longDescription,
          })}
        >
          {({ isEditing, value, setValue, enableEditor }) => {
            if (isEditing) {
              return (
                <HTMLEditor
                  defaultValue={collective.longDescription}
                  onChange={e => setValue(e.target.value)}
                  placeholder={intl.formatMessage(messages.placeholder)}
                  toolbarTop={[60, null, 119]}
                  toolbarBackgroundColor="#F7F8FA"
                  withStickyToolbar
                  autoFocus
                />
              );
            } else if (isEmptyDescription) {
              return (
                <Flex justifyContent="center">
                  {canEdit ? (
                    <Flex flexDirection="column" alignItems="center">
                      {isCollective && !isFund && (
                        <MessageBox type="info" withIcon fontStyle="italic" fontSize="14px" mb={4}>
                          <FormattedMessage
                            id="SectionAbout.Why"
                            defaultMessage="Your collective is unique and wants to achieve great things. Here is the place to explain it!"
                          />
                        </MessageBox>
                      )}
                      <StyledButton buttonSize="large" onClick={enableEditor}>
                        <FormattedMessage id="CollectivePage.AddLongDescription" defaultMessage="Add a description" />
                      </StyledButton>
                    </Flex>
                  ) : (
                    <Span color="black.500" fontStyle="italic">
                      <FormattedMessage
                        id="SectionAbout.MissingDescription"
                        defaultMessage="{collectiveName} didn't write a presentation yet"
                        values={{ collectiveName: collective.name }}
                      />
                    </Span>
                  )}
                </Flex>
              );
            } else {
              return <HTMLContent content={value} data-cy="longDescription" />;
            }
          }}
        </InlineEditField>
      </Container>
    </ContainerSectionContent>
  );
};

SectionAbout.propTypes = {
  /** The collective to display description for */
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    longDescription: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    isArchived: PropTypes.bool,
    settings: PropTypes.object,
    currency: PropTypes.string,
  }).isRequired,

  /** Can user edit the description? */
  canEdit: PropTypes.bool,

  /** @ignore from injectIntl */
  intl: PropTypes.object,
};

export default React.memo(injectIntl(SectionAbout));
