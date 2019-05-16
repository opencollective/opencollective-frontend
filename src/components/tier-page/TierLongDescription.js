import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import styled from 'styled-components';

import { Edit } from 'styled-icons/feather/Edit';

// Open Collective Frontend imports
import StyledButton from '../StyledButton';
import Container from '../Container';
import HTMLEditor from '../HTMLEditor';
import MessageBox from '../MessageBox';

/** Container used to show the description to users than can edit it */
const EditIcon = styled(Edit)`
  cursor: pointer;
  &:hover {
    color: lightgrey;
  }
`;

/** Long description container */
const LongDescription = styled.div`
  /** Override global styles to match what we have in the editor */
  h1,
  h2,
  h3 {
    margin: 0;
  }

  img {
    max-width: 100%;
  }
`;

/**
 * Rich description for the tier, with the ability to edit it with a rich text
 * editor if `canEdit` is true. If the description is missing, a button invinting
 * the user to add one will be shown instead.
 */
class TierLongDescription extends Component {
  static propTypes = {
    /** The tier ID, used to edit the tier */
    tierId: PropTypes.number.isRequired,
    /** The tier longDescription */
    description: PropTypes.string,
    /** Can user edit the description */
    canEdit: PropTypes.bool,
  };

  state = {
    isEditing: false,
    descriptionDraft: '',
  };

  enableEditor = () => {
    this.setState({ isEditing: true, descriptionDraft: this.props.description });
  };

  closeEditor = () => {
    this.setState({ isEditing: false });
  };

  render() {
    const { tierId, description, canEdit } = this.props;
    const { isEditing, descriptionDraft } = this.state;
    const touched = descriptionDraft !== description;

    if (isEditing) {
      return (
        <Mutation
          mutation={gql`
            mutation UpdateTier($tier: TierInputType!) {
              editTier(tier: $tier) {
                id
                longDescription
              }
            }
          `}
        >
          {(updateTier, { loading, error }) => (
            <Box>
              <HTMLEditor
                defaultValue={description}
                onChange={descriptionDraft => this.setState({ descriptionDraft })}
                allowedHeaders={[false, 2, 3]} /** Disable H1 */
              />
              {error && (
                <MessageBox type="error" mt={2} withIcon>
                  {error.message}
                </MessageBox>
              )}
              <Flex flexWrap="wrap" mt={2} justifyContent="center">
                <StyledButton
                  textTransform="capitalize"
                  mx={2}
                  buttonSize="large"
                  buttonStyle="primary"
                  loading={loading}
                  disabled={!touched}
                  onClick={() => {
                    updateTier({
                      variables: {
                        tier: { id: tierId, longDescription: descriptionDraft },
                      },
                    }).then(this.closeEditor);
                  }}
                >
                  <FormattedMessage id="save" defaultMessage="save" />
                </StyledButton>
                <StyledButton
                  textTransform="capitalize"
                  mx={2}
                  buttonSize="large"
                  disabled={loading}
                  onClick={this.closeEditor}
                >
                  <FormattedMessage id="form.cancel" defaultMessage="Cancel" />
                </StyledButton>
              </Flex>
            </Box>
          )}
        </Mutation>
      );
    } else if (!description) {
      return !canEdit ? null : (
        <Flex justifyContent="center" mt={5}>
          <StyledButton buttonSize="large" onClick={this.enableEditor}>
            <FormattedMessage id="TierPage.AddDescription" defaultMessage="Add a description to this tier" />
          </StyledButton>
        </Flex>
      );
    } else {
      return (
        <Container position="relative">
          {canEdit && (
            <Container position="absolute" top={0} right={0}>
              <EditIcon size={24} onClick={this.enableEditor} />
            </Container>
          )}
          <LongDescription dangerouslySetInnerHTML={{ __html: description }} />
        </Container>
      );
    }
  }
}

export default TierLongDescription;
