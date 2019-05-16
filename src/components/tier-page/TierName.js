import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import styled from 'styled-components';

import { Edit } from 'styled-icons/feather/Edit';

// Open Collective Frontend imports
import { H1 } from '../Text';
import StyledButton from '../StyledButton';
import Container from '../Container';
import MessageBox from '../MessageBox';
import StyledTextarea from '../StyledTextarea';

/** Container used to show the description to users than can edit it */
const EditIcon = styled(Edit)`
  cursor: pointer;
  &:hover {
    color: lightgrey;
  }
`;

/**
 * Tier title, with the ability to edit it if user is allowed to do so,
 */
class TierName extends Component {
  static propTypes = {
    /** The tier ID, used to edit the tier */
    tierId: PropTypes.number.isRequired,
    /** The tier name */
    name: PropTypes.string,
    /** Can user edit the description */
    canEdit: PropTypes.bool,
  };

  state = {
    isEditing: false,
    nameDraft: '',
  };

  enableEditor = () => {
    this.setState({ isEditing: true, nameDraft: this.props.name });
  };

  closeEditor = () => {
    this.setState({ isEditing: false });
  };

  render() {
    const { tierId, name, canEdit } = this.props;
    const { isEditing, nameDraft } = this.state;
    const touched = nameDraft !== name;

    if (isEditing) {
      return (
        <Mutation
          mutation={gql`
            mutation UpdateTier($tier: TierInputType!) {
              editTier(tier: $tier) {
                id
                name
              }
            }
          `}
        >
          {(updateTier, { loading, error }) => (
            <Box>
              <H1 textAlign="left" color="black.900" mb={4}>
                <StyledTextarea
                  autoSize
                  autoFocus
                  width={1}
                  value={nameDraft}
                  onChange={e => this.setState({ nameDraft: e.target.value })}
                  px={0}
                  py={0}
                  border="0"
                  letterSpacing="inherit"
                  fontSize="inherit"
                  fontWeight="inherit"
                  lineHeight="inherit"
                />
              </H1>
              {error && (
                <MessageBox type="error" my={2} withIcon>
                  {error.message}
                </MessageBox>
              )}
              <Flex flexWrap="wrap" justifyContent="center">
                <StyledButton
                  textTransform="capitalize"
                  mx={2}
                  buttonSize="large"
                  buttonStyle="primary"
                  loading={loading}
                  disabled={!touched}
                  onClick={() => {
                    updateTier({
                      variables: { tier: { id: tierId, name: nameDraft.trim() || null } },
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
              <hr />
            </Box>
          )}
        </Mutation>
      );
    } else if (!name) {
      return !canEdit ? null : (
        <Flex justifyContent="center">
          <StyledButton buttonSize="large" onClick={this.enableEditor}>
            <FormattedMessage id="TierPage.AddTitle" defaultMessage="Add a title to this tier" />
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
          <H1 textAlign="left" color="black.900">
            {name}
          </H1>
        </Container>
      );
    }
  }
}

export default TierName;
