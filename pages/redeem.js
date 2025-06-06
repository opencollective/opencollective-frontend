import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';
import { fontSize, maxWidth } from 'styled-system';

import { getErrorFromGraphqlException } from '../lib/errors';
import { gqlV1 } from '../lib/graphql/helpers';
import { compose, isValidEmail } from '../lib/utils';

import Body from '../components/Body';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import Container from '../components/Container';
import CollectiveCard from '../components/gift-cards/CollectiveCard';
import HappyBackground from '../components/gift-cards/HappyBackground';
import { Box, Flex } from '../components/Grid';
import Header from '../components/Header';
import LinkCollective from '../components/LinkCollective';
import LoadingPlaceholder from '../components/LoadingPlaceholder';
import Footer from '../components/navigation/Footer';
import RedeemForm from '../components/RedeemForm';
import RedeemSuccess from '../components/RedeemSuccess';
import StyledButton from '../components/StyledButton';
import { H1, H5, P } from '../components/Text';
import { withUser } from '../components/UserProvider';

const ShadowBox = styled(Box)`
  box-shadow: 0px 8px 16px rgba(20, 20, 20, 0.12);
`;

const Subtitle = styled(H5)`
  color: white;
  text-align: center;
  margin: 0 auto;
  ${fontSize};
  ${maxWidth};
`;

class RedeemPage extends React.Component {
  static getInitialProps({ query: { code, email, name, collectiveSlug } }) {
    return {
      collectiveSlug,
      code: code?.trim(),
      email: email?.trim(),
      name: name?.trim(),
    };
  }

  static propTypes = {
    refetchLoggedInUser: PropTypes.func.isRequired, // from withUser
    intl: PropTypes.object.isRequired, // from injectIntl
    redeemPaymentMethod: PropTypes.func.isRequired, // from addRedeemPaymentMethodMutation
    LoggedInUser: PropTypes.object, // from withUser
    loadingLoggedInUser: PropTypes.bool, // from withUser
    code: PropTypes.string,
    name: PropTypes.string,
    collectiveSlug: PropTypes.string,
    email: PropTypes.string,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      Collective: PropTypes.shape({
        slug: PropTypes.string,
        backgroundImageUrl: PropTypes.string,
        imageUrl: PropTypes.string,
        name: PropTypes.string,
      }),
    }),
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);
    const { code, email, name } = props;
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {
      loading: false,
      view: 'form', // form or success
      form: { code, email, name },
      LoggedInUser: undefined,
    };
    this.messages = defineMessages({
      'error.email.invalid': {
        id: 'error.email.invalid',
        defaultMessage: 'Invalid email address',
      },
      'error.code.invalid': {
        id: 'error.code.invalid',
        defaultMessage: 'Invalid Gift Card code',
      },
    });
  }

  async claimPaymentMethod() {
    this.setState({ loading: true });
    const { code, email, name } = this.state.form;
    try {
      if (this.props.LoggedInUser) {
        await this.props.redeemPaymentMethod({ variables: { code } });
        await this.props.refetchLoggedInUser();
        if (this.props.collectiveSlug === 'strapijs') {
          this.props.router.push('https://strapi.io/open-collective-gift-card-redeemed');
        } else {
          this.props.router.push({ pathname: `/${this.props.collectiveSlug}/redeemed/${code}` });
        }
        return;
      } else {
        await this.props.redeemPaymentMethod({ variables: { code, user: { email, name } } });
      }
      // TODO: need to know from API if an account was created or not
      // TODO: or refuse to create an account automatically and ask to sign in
      this.setState({ loading: false, view: 'success' });
    } catch (e) {
      const error = getErrorFromGraphqlException(e).message;
      this.setState({ loading: false, error });
    }
  }

  handleChange(form) {
    this.setState({ form, error: null });
  }

  handleSubmit() {
    const { intl } = this.props;
    if (!this.props.LoggedInUser && !isValidEmail(this.state.form.email)) {
      return this.setState({
        error: intl.formatMessage(this.messages['error.email.invalid']),
      });
    }
    if (get(this.state, 'form.code', '').length !== 8) {
      return this.setState({
        error: intl.formatMessage(this.messages['error.code.invalid']),
      });
    }
    this.claimPaymentMethod();
  }

  renderHeroContent() {
    const { data } = this.props;

    if (!data || (!data.loading && !data.Collective)) {
      return (
        <React.Fragment>
          <Box mt={5}>
            <H1 color="white.full" textAlign="center" fontSize={['1.9rem', null, '2.5rem']}>
              <FormattedMessage id="redeem.title" defaultMessage="Redeem Gift Card" />
            </H1>
          </Box>

          <Box mt={2}>
            <Subtitle fontSize={['0.95rem', null, '1.25rem']} maxWidth={['90%', '640px']}>
              <Box>
                <FormattedMessage
                  id="redeem.subtitle.line1"
                  defaultMessage="Open Collective helps communities - like open source projects, meetups and social movements - raise funds spend them transparently."
                />
              </Box>
            </Subtitle>
          </Box>
        </React.Fragment>
      );
    } else if (data.loading) {
      return <LoadingPlaceholder height={400} />;
    } else {
      const collective = data.Collective;
      return (
        <CollectiveCard collective={collective} mt={5}>
          <LinkCollective collective={collective}>
            <H1 color="black.900" fontSize="1.9rem" lineHeight="1em" wordBreak="break-word" my={2} textAlign="center">
              {collective.name}
            </H1>
          </LinkCollective>
          <P mb={3}>
            <FormattedMessage
              id="redeem.fromCollective"
              defaultMessage="You're about to redeem a gift card, courtesy of {collective}"
              values={{
                collective: (
                  <strong>
                    <LinkCollective collective={data.Collective} />
                  </strong>
                ),
              }}
            />
          </P>
        </CollectiveCard>
      );
    }
  }

  render() {
    const { code, email, name, LoggedInUser, loadingLoggedInUser, data } = this.props;
    const { form } = this.state;
    const collective = data && data.Collective;

    return (
      <div className="RedeemedPage">
        <Header
          title="Redeem Gift Card"
          description="Use your gift card to support open source projects that you are contributing to."
          LoggedInUser={LoggedInUser}
        />
        <Body>
          <CollectiveThemeProvider collective={collective}>
            <Flex alignItems="center" flexDirection="column">
              <HappyBackground collective={collective}>
                <div>{this.renderHeroContent()}</div>
              </HappyBackground>
              <Flex alignItems="center" flexDirection="column" mt={-175} mb={4}>
                <Container mt={54} zIndex={2}>
                  <Flex justifyContent="center" alignItems="center" flexDirection="column">
                    <Container background="white" borderRadius="16px" maxWidth="400px">
                      <ShadowBox py="24px" px="32px">
                        {this.state.view === 'form' && (
                          <RedeemForm
                            code={code}
                            name={name}
                            email={email}
                            LoggedInUser={LoggedInUser}
                            loadingLoggedInUser={loadingLoggedInUser}
                            onChange={this.handleChange}
                          />
                        )}
                        {this.state.view === 'success' && <RedeemSuccess email={email} />}
                      </ShadowBox>
                    </Container>
                    {this.state.view === 'form' && (
                      <Flex my={4} px={2} flexDirection="column" alignItems="center">
                        <StyledButton
                          buttonStyle="primary"
                          buttonSize="large"
                          onClick={this.handleSubmit}
                          loading={this.state.loading}
                          disabled={!form.code || this.props.loadingLoggedInUser}
                          mb={2}
                          maxWidth={335}
                          width={1}
                          textTransform="capitalize"
                        >
                          {this.state.loading ? (
                            <FormattedMessage id="form.processing" defaultMessage="processing" />
                          ) : (
                            <FormattedMessage id="redeem.form.redeem.btn" defaultMessage="redeem" />
                          )}
                        </StyledButton>
                        {this.state.error && <P color="red.500">{this.state.error}</P>}
                      </Flex>
                    )}
                  </Flex>
                </Container>
              </Flex>
            </Flex>
          </CollectiveThemeProvider>
        </Body>
        <Footer />
      </div>
    );
  }
}

const redeemPageQuery = gqlV1/* GraphQL */ `
  query RedeemPage($collectiveSlug: String!) {
    Collective(slug: $collectiveSlug) {
      id
      name
      type
      slug
      imageUrl
      backgroundImageUrl
      description
      settings
    }
  }
`;

const addRedeemPageData = graphql(redeemPageQuery, {
  skip: props => !props.collectiveSlug,
});

const redeemPaymentMethodMutation = gqlV1/* GraphQL */ `
  mutation RedeemPaymentMethod($code: String!, $user: UserInputType) {
    claimPaymentMethod(code: $code, user: $user) {
      id
      description
    }
  }
`;

const addRedeemPaymentMethodMutation = graphql(redeemPaymentMethodMutation, {
  name: 'redeemPaymentMethod',
});

const addGraphql = compose(addRedeemPageData, addRedeemPaymentMethodMutation);

// next.js export
// ts-unused-exports:disable-next-line
export default injectIntl(withUser(withRouter(addGraphql(RedeemPage))));
