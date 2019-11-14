import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import { Flex } from '@rebass/grid';
import dynamic from 'next/dynamic';

import { CollectiveType } from '../../../lib/constants/collectives';
import { Span } from '../../Text';
import HTMLContent, { isEmptyValue } from '../../HTMLContent';
import InlineEditField from '../../InlineEditField';
import Container from '../../Container';
import StyledButton from '../../StyledButton';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import { EditCollectiveLongDescriptionMutation } from '../graphql/mutations';
import SectionTitle from '../SectionTitle';

// Dynamicly load HTMLEditor to download it only if user can edit the page
const HTMLEditorLoadingPlaceholder = () => <LoadingPlaceholder height={400} />;
const HTMLEditor = dynamic(() => import('../ReverseCompatibleHTMLEditor'), {
  loading: HTMLEditorLoadingPlaceholder,
  ssr: false, // No need for SSR as user needs to be logged in
});

// Some collectives have a legacy markdown description. We load the markdown renderer only
// if this is the case.
const Markdown = dynamic(() => import('react-markdown'));

const messages = defineMessages({
  placeholder: {
    id: 'CollectivePage.AddLongDescription',
    defaultMessage: 'Add a description',
  },
});

/**
 * Display the inline editable description section for the collective
 */
const SectionAbout = ({ collective, canEdit, intl }) => {
  const isEmptyDescription = isEmptyValue(collective.longDescription);
  const isCollective = collective.type === CollectiveType.COLLECTIVE;
  canEdit = collective.isArchived ? false : canEdit;

  return (
    <Flex flexDirection="column" alignItems="center" px={2} pt={[4, 5]}>
      <SectionTitle textAlign="center" mb={5}>
        <FormattedMessage id="collective.about.title" defaultMessage="About" />
      </SectionTitle>

      <Container width="100%" maxWidth={700} margin="0 auto">
        <InlineEditField
          mutation={EditCollectiveLongDescriptionMutation}
          values={collective}
          field="longDescription"
          canEdit={canEdit}
          topEdit={-20}
          showEditIcon={!isEmptyDescription}
          formatBeforeSubmit={v => (isEmptyValue(v) ? null : v)}
        >
          {({ isEditing, value, setValue, enableEditor }) => {
            if (isEditing) {
              return (
                <HTMLContent>
                  <HTMLEditor
                    defaultValue={collective.longDescription}
                    onChange={setValue}
                    placeholder={intl.formatMessage(messages.placeholder)}
                    toolbarTop={[60, null, 119]}
                    withStickyToolbar
                    autoFocus
                  />
                </HTMLContent>
              );
            } else if (isEmptyDescription) {
              return (
                <Flex justifyContent="center">
                  {canEdit ? (
                    <Flex flexDirection="column" alignItems="center">
                      {isCollective && (
                        <MessageBox type="info" withIcon fontStyle="italic" fontSize="Paragraph" mb={4}>
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
            } else if (value[0] !== '<') {
              // Fallback while we transition from old collective page to the new one.
              // Should be removed after migration to V2 is done.
              return (
                <HTMLContent>
                  <Markdown source={value} data-cy="longDescription" />
                </HTMLContent>
              );
            } else {
              return <HTMLContent content={value} data-cy="longDescription" />;
            }
          }}
        </InlineEditField>
      </Container>
    </Flex>
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
  }).isRequired,

  /** Can user edit the description? */
  canEdit: PropTypes.bool,

  /** @ignore from injectIntl */
  intl: PropTypes.object,
};

export default React.memo(injectIntl(SectionAbout));
