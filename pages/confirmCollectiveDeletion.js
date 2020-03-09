import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import themeGet from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import { Flex } from '@rebass/grid';

import Container from '../components/Container';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';
import { H3, P } from '../components/Text';
import { PaperPlane } from '@styled-icons/boxicons-regular/PaperPlane';

const Icon = styled(PaperPlane)`
  color: ${themeGet('colors.primary.300')};
`;

class ConfirmCollectiveDeletion extends Component {
  static async getInitialProps({ res, query = {}, router }) {
    if (query.type) {
      return { type: query.type };
    }

    if (res) {
      res.statusCode = 302;
      res.setHeader('Location', '/');
      res.end();
    } else {
      router.pushRoute('home');
    }
    return {};
  }

  constructor(props) {
    super(props);
    if (props.type === 'USER') {
      this.props.logout();
    }
  }

  getCollectiveType(type) {
    switch (type) {
      case 'ORGANIZATION':
        return 'organization';
      case 'COLLECTIVE':
        return 'collective';
      case 'EVENT':
        return 'event';
      default:
        return 'account';
    }
  }

  render() {
    const { type } = this.props;
    const collectiveType = this.getCollectiveType(type);

    return (
      <Page title="Deletion Confirmation">
        <Container pt={4} pb={6} px={2} background="linear-gradient(180deg, #EBF4FF, #FFFFFF)" textAlign="center">
          <Flex justifyContent="center" mb={4}>
            <Icon size="60" />
          </Flex>
          <H3 as="h1" fontWeight="800">
            <FormattedMessage
              values={{
                collectiveType,
              }}
              id="confirmCollective.deletion.title"
              defaultMessage="Your {collectiveType} has been deleted."
            />
          </H3>
          {type === 'USER' ? (
            <P fontSize="LeadParagraph" lineHeight="LeadParagraph" color="black.900" mt={4}>
              <FormattedMessage
                id="confirmCollective.user.deletion.description"
                defaultMessage="We've deleted your user account, expenses, payment methods, and connected accounts."
              />
            </P>
          ) : (
            <P fontSize="LeadParagraph" lineHeight="LeadParagraph" color="black.900" mt={4}>
              <FormattedMessage
                id="confirmCollective.other.deletion.description"
                values={{ collectiveType }}
                defaultMessage="We've deleted your {collectiveType}, expenses, contributors, tiers, and all entities related to this 
                {collectiveType}."
              />
            </P>
          )}
        </Container>
      </Page>
    );
  }
}

ConfirmCollectiveDeletion.propTypes = {
  type: PropTypes.string.isRequired,
  logout: PropTypes.func,
};

export default withUser(ConfirmCollectiveDeletion);
