import { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { themeGet } from 'styled-system';

import { Flex } from '@rebass/grid';
import Container from '../components/Container';
import Page from '../components/Page';
import { withUser } from '../components/UserProvider';
import { H3, P } from '../components/Text';
import { PaperPlane } from 'styled-icons/boxicons-regular/PaperPlane';

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
      res.setHeader('Location', '/home');
      res.end();
    } else {
      router.pushRoute('home');
    }
    return {};
  }

  constructor(props) {
    super(props);
    this.props.logout();
  }

  // async componentDidMount () {
  //   await
  // }

  getCollectiveType(type) {
    switch (type) {
      case 'ORGANIZATION':
        return 'organization';
      case 'COLLECTIVE':
        return 'collective';
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
            Your {collectiveType} has been deleted.
          </H3>
          {type === 'USER' ? (
            <P fontSize="LeadParagraph" lineHeight="LeadParagraph" color="black.900" mt={4}>
              We&apos;ve deleted your account, memberships, expenses, payment methods and all connected accounts.
            </P>
          ) : (
            <P fontSize="LeadParagraph" lineHeight="LeadParagraph" color="black.900" mt={4}>
              We&apos;ve deleted your {collectiveType}, expenses, members, tiers and all related entities to this{' '}
              {collectiveType}.
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
