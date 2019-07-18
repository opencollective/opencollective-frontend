import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { Flex } from '@rebass/grid';
import dynamic from 'next/dynamic';

import { H3, Span } from '../Text';
import HTMLContent, { isEmptyValue } from '../HTMLContent';
import InlineEditField from '../InlineEditField';
import Container from '../Container';
import StyledButton from '../StyledButton';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import { CollectiveType } from '../../constants/collectives';

// Dynamicly load HTMLEditor to download it only if user can edit the page
const HTMLEditorLoadingPlaceholder = () => <LoadingPlaceholder height={400} />;
const HTMLEditor = dynamic({
  loading: HTMLEditorLoadingPlaceholder,
  modules: () => {
    return {
      Showdown: () => import('showdown'),
      HTMLEditor: () => import(/* webpackChunkName: 'HTMLEditor' */ '../HTMLEditor').then(mod => mod.default),
    };
  },
  // Having a convertion with Showdown here will ensure a smooth migration
  // from old collective page that used an (unofficial) markdown description.
  // Once the new collective page becomes the default, we should remove all
  // markdow-related code from the new collective page.
  // eslint-disable-next-line react/display-name
  render: (props, { HTMLEditor, Showdown }) => {
    // eslint-disable-next-line react/prop-types
    const defaultValue = props.defaultValue;
    const isMarkdown = defaultValue && defaultValue[0] !== '<';
    const htmlValue = isMarkdown ? new Showdown.Converter().makeHtml(defaultValue) : defaultValue;
    return <HTMLEditor {...props} defaultValue={htmlValue} />;
  },
  ssr: false,
});

// Some collectives have a legacy markdown description. We load the markdown renderer only
// if this is the case.
const Markdown = dynamic(() => import('react-markdown'));

/**
 * Display the inline editable description section for the collective
 */
const SectionAbout = ({ collective, canEdit, editMutation }) => {
  const isEmptyDescription = isEmptyValue(collective.longDescription);
  canEdit = collective.isArchived ? false : canEdit;

  return (
    <Flex flexDirection="column" alignItems="center" px={2} pb={6} pt={[3, 5]}>
      <H3 fontSize="H2" lineHeight="H2" fontWeight="normal" textAlign="center" mb={5}>
        {collective.type === CollectiveType.COLLECTIVE ? (
          <FormattedMessage id="SectionAbout.Title" defaultMessage="Why we do what we do" />
        ) : (
          <FormattedMessage
            id="SectionAbout.TitleAlt"
            defaultMessage="About {collectiveName}"
            values={{ collectiveName: collective.name }}
          />
        )}
      </H3>

      <Container width="100%" maxWidth={700} margin="0 auto">
        <InlineEditField
          mutation={editMutation}
          values={collective}
          field="longDescription"
          canEdit={canEdit}
          showEditIcon={!isEmptyDescription}
          formatBeforeSubmit={v => (isEmptyValue(v) ? null : v)}
        >
          {({ isEditing, value, setValue, enableEditor }) => {
            if (isEditing) {
              return (
                <HTMLContent>
                  <HTMLEditor
                    defaultValue={value}
                    onChange={setValue}
                    allowedHeaders={[false, 2, 3]} /** Disable H1 */
                  />
                </HTMLContent>
              );
            } else if (isEmptyDescription) {
              return (
                <Flex justifyContent="center">
                  {canEdit ? (
                    <Flex flexDirection="column" alignItems="center">
                      <MessageBox type="info" withIcon fontStyle="italic" fontSize="Paragraph" mb={4}>
                        <FormattedMessage
                          id="SectionAbout.Why"
                          defaultMessage="Your collective is unique and wants to achieve great things. Here is the place to explain it!"
                        />
                      </MessageBox>
                      <StyledButton buttonSize="large" onClick={enableEditor}>
                        <FormattedMessage id="CollectivePage.AddLongDescription" defaultMessage="Add your mission" />
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
  /** A mutation used to update the description */
  editMutation: PropTypes.object,
  /** Can user edit the description? */
  canEdit: PropTypes.bool,
};

export default React.memo(SectionAbout);
