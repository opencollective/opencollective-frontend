import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import styled from 'styled-components';
import sanitizeHtml from 'sanitize-html';
import { graphql } from 'react-apollo';
import { backgroundSize, fontSize, minHeight, maxWidth } from 'styled-system';
import { Flex, Box } from '@rebass/grid';
import { FormattedMessage, defineMessages } from 'react-intl';
import { get } from 'lodash';

import { Router } from '../server/pages';

import { withUser } from '../components/UserProvider';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import Container from '../components/Container';
import RedeemForm from '../components/RedeemForm';
import RedeemSuccess from '../components/RedeemSuccess';
import { P, H1, H5 } from '../components/Text';

import { getLoggedInUserQuery } from '../graphql/queries';
import { isValidEmail } from '../lib/utils';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';

const Error = styled(P)`
  color: red;
`;

const BlueButton = styled.button`
  --webkit-appearance: none;
  width: 336px;
  height: 56px;
  border: none;
  background: #3385ff;
  border-radius: 100px;
  color: white;
  font-size: 1.6rem;
  line-height: 5.2rem;
  text-align: center;
  margin: 16px;
  &&:hover {
    background: #66a3ff;
  }
  &&:active {
    background: #145ecc;
  }
  &&:disabled {
    background: #e0edff;
  }
`;

const ShadowBox = styled(Box)`
  box-shadow: 0px 8px 16px rgba(20, 20, 20, 0.12);
`;

const Title = styled(H1)`
  color: white;
  ${fontSize};
`;

const Subtitle = styled(H5)`
  color: white;
  ${fontSize};
  ${maxWidth};
`;

const Hero = styled(Box)`
  width: 100%;
  ${minHeight};
  background-image: url('/static/images/redeem-hero.svg');
  background-position: center top;
  background-repeat: no-repeat;
  background-size: auto 376px;
  ${backgroundSize};
`;

class RedeemPage extends React.Component {
  static getInitialProps({ query: { code, email, name } }) {
    return {
      code: sanitizeHtml(code || '', {
        allowedTags: [],
        allowedAttributes: [],
      }),
      email: sanitizeHtml(email || '', {
        allowedTags: [],
        allowedAttributes: [],
      }),
      name: sanitizeHtml(name || '', {
        allowedTags: [],
        allowedAttributes: [],
      }),
    };
  }

  static propTypes = {
    refetchLoggedInUser: PropTypes.func.isRequired, // from withUser
    intl: PropTypes.object.isRequired, // from withIntl
    claimPaymentMethod: PropTypes.func.isRequired, // from redeemMutation
    LoggedInUser: PropTypes.object, // from withUser
    code: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
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
      let res;
      if (this.props.LoggedInUser) {
        res = await this.props.claimPaymentMethod(code);

        // Refresh LoggedInUser
        this.props.refetchLoggedInUser();
        Router.pushRoute('redeemed', { code });
        return;
      } else {
        res = await this.props.claimPaymentMethod(code, { email, name });
      }
      console.log('>>> res graphql: ', JSON.stringify(res, null, '  '));
      // TODO: need to know from API if an account was created or not
      // TODO: or refuse to create an account automatically and ask to sign in
      this.setState({ loading: false, view: 'success' });
    } catch (e) {
      const error = e.graphQLErrors && e.graphQLErrors[0].message;
      this.setState({ loading: false, error });
      // console.log(">>> error graphql: ", JSON.stringify(error, null, '  '));
      console.log('>>> error graphql: ', error);
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

  render() {
    const { code, email, name, LoggedInUser } = this.props;

    return (
      <div className="RedeemedPage">
        <Header
          title="Redeem Gift Card"
          description="Use your gift card to support open source projects that you are contributing to."
          LoggedInUser={LoggedInUser}
        />
        <Body>
          <Flex alignItems="center" flexDirection="column">
            <Hero minHeight={['500px', null, '700px']} backgroundSize={['auto 300px', 'auto 380px']}>
              <Flex alignItems="center" flexDirection="column">
                <Box mt={5}>
                  <Title fontSize={['3rem', null, '4rem']}>Redeem Gift Card</Title>
                </Box>

                <Box mt={2}>
                  <Subtitle fontSize={['1.5rem', null, '2rem']} maxWidth={['90%', '640px']}>
                    <Box>
                      <FormattedMessage
                        id="redeem.subtitle.line1"
                        defaultMessage="Open Collective helps communities - like open source projects, meetups and social movements - raise funds spend them transparently."
                      />
                    </Box>
                  </Subtitle>
                </Box>

                <Box mt={[4, 5]}>
                  <Flex justifyContent="center" flexDirection="column">
                    <Container background="white" borderRadius="16px" width="400px">
                      <ShadowBox py="24px" px="32px">
                        {this.state.view === 'form' && (
                          <RedeemForm
                            code={code}
                            name={name}
                            email={email}
                            LoggedInUser={LoggedInUser}
                            onChange={this.handleChange}
                          />
                        )}
                        {this.state.view === 'success' && <RedeemSuccess email={email} />}
                      </ShadowBox>
                    </Container>
                    {this.state.view === 'form' && (
                      <Box my={3} align="center">
                        <BlueButton onClick={this.handleSubmit} disabled={this.state.loading}>
                          {this.state.loading ? (
                            <FormattedMessage id="form.processing" defaultMessage="processing" />
                          ) : (
                            <FormattedMessage id="redeem.form.redeem.btn" defaultMessage="redeem" />
                          )}
                        </BlueButton>
                        {this.state.error && <Error>{this.state.error}</Error>}
                      </Box>
                    )}
                  </Flex>
                </Box>
              </Flex>
            </Hero>
          </Flex>
        </Body>
        <Footer />
      </div>
    );
  }
}

const redeemMutation = gql`
  mutation claimPaymentMethod($code: String!, $user: UserInputType) {
    claimPaymentMethod(code: $code, user: $user) {
      id
      description
    }
  }
`;

const addMutation = graphql(redeemMutation, {
  props: ({ mutate }) => ({
    claimPaymentMethod: async (code, user) => {
      // Claim payment method and refresh LoggedInUser Apollo cache so
      // `client.query` will deliver new data for next call
      return await mutate({
        variables: { code, user },
        awaitRefetchQueries: true,
        refetchQueries: [{ query: getLoggedInUserQuery }],
      });
    },
  }),
});

export default withData(withIntl(withUser(addMutation(RedeemPage))));
