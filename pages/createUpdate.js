import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { ArrowBack } from '@styled-icons/boxicons-regular';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';
import { addCollectiveCoverData } from '../lib/graphql/queries';
import { compose } from '../lib/utils';

import Body from '../components/Body';
import CollectiveNavbar from '../components/collective-navbar';
import Container from '../components/Container';
import EditUpdateForm from '../components/EditUpdateForm';
import ErrorPage from '../components/ErrorPage';
import Footer from '../components/Footer';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import Link from '../components/Link';
import MessageBox from '../components/MessageBox';
import StyledButton from '../components/StyledButton';
import { H1 } from '../components/Text';
import { withUser } from '../components/UserProvider';

const BackButtonWrapper = styled(Container)`
  position: relative;
  color: #71757a;
  margin-right: 62px;
  margin-left: 20px;
  @media (max-width: 600px) {
    margin-left: 0;
  }
`;

const CreateUpdateWrapper = styled(Flex)`
  @media (max-width: 600px) {
    flex-direction: column;
  }
`;

class CreateUpdatePage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, action } }) {
    return { slug: collectiveSlug, action };
  }

  static propTypes = {
    slug: PropTypes.string, // for addCollectiveCoverData
    action: PropTypes.string, // not used atm, not clear where it's coming from, not in the route
    createUpdate: PropTypes.func, // from addMutation/createUpdateQuery
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object,
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.state = { update: {}, status: '', error: '' };
  }

  createUpdate = async update => {
    const {
      data: { Collective },
    } = this.props;

    this.setState({ error: '', status: 'submitting' });

    try {
      update.account = { legacyId: Collective.id };
      const res = await this.props.createUpdate({ variables: { update } });
      this.setState({ isModified: false });
      return this.props.router.push(`/${Collective.slug}/updates/${res.data.createUpdate.slug}`);
    } catch (e) {
      this.setState({ status: 'error', error: e.message });
    }
  };

  handleChange = (attr, value) => {
    const update = this.state.update;
    update[attr] = value;
    this.setState({ update, isModified: true });
  };

  render() {
    const { data } = this.props;
    const { LoggedInUser } = this.props;

    if (!data.Collective) {
      return <ErrorPage data={data} />;
    }

    const collective = data.Collective;
    const isAdmin = LoggedInUser && LoggedInUser.canEditCollective(collective);

    return (
      <div>
        <Header collective={collective} LoggedInUser={LoggedInUser} />

        <Body>
          <CollectiveNavbar collective={collective} isAdmin={isAdmin} />
          <CreateUpdateWrapper className="content" mt={4} alignItems="baseline">
            <BackButtonWrapper>
              <Link href={`/${collective.slug}/updates`}>
                <Container display="flex" color="#71757A" fontSize="14px" alignItems="center">
                  <ArrowBack size={18} />
                  <Box as="span" mx={2}>
                    Back
                  </Box>
                </Container>
              </Link>
            </BackButtonWrapper>
            <Container width={1} maxWidth={650}>
              {!isAdmin && (
                <div className="login">
                  <p>
                    <FormattedMessage
                      id="updates.create.login"
                      defaultMessage="You need to be logged in as a core contributor of this collective to be able to create an update."
                    />
                  </p>
                  <p>
                    <StyledButton buttonStyle="primary" href={`/signin?next=/${collective.slug}/updates/new`}>
                      <FormattedMessage id="signIn" defaultMessage="Sign In" />
                    </StyledButton>
                  </p>
                </div>
              )}
              {isAdmin && (
                <Container my={3}>
                  <H1 textAlign="left" fontSize="34px">
                    <FormattedMessage id="updates.new.title" defaultMessage="New update" />
                  </H1>
                </Container>
              )}
              {isAdmin && <EditUpdateForm collective={collective} onSubmit={this.createUpdate} />}
              {this.state.status === 'error' && (
                <MessageBox type="error" withIcon>
                  <FormattedMessage
                    id="updates.new.error"
                    defaultMessage="Update failed: {err}"
                    values={{ err: this.state.error }}
                  />
                </MessageBox>
              )}
            </Container>
          </CreateUpdateWrapper>
        </Body>
        <Footer />
      </div>
    );
  }
}

const createUpdateMutation = gqlV2/* GraphQL */ `
  mutation CreateUpdate($update: UpdateCreateInput!) {
    createUpdate(update: $update) {
      id
      slug
      title
      summary
      html
      createdAt
      publishedAt
      updatedAt
      tags
      isPrivate
      makePublicOn
      account {
        id
        slug
      }
      fromAccount {
        id
        type
        name
        slug
      }
    }
  }
`;

const addCreateUpdateMutation = graphql(createUpdateMutation, {
  name: 'createUpdate',
  options: {
    context: API_V2_CONTEXT,
  },
});

const addGraphql = compose(addCollectiveCoverData, addCreateUpdateMutation);

export default withUser(addGraphql(withRouter(CreateUpdatePage)));
