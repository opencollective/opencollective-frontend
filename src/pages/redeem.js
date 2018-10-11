import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import styled from 'styled-components';
import { graphql } from 'react-apollo';
import { backgroundSize, fontSize, minHeight, maxWidth } from 'styled-system';
import { Flex, Box } from 'grid-styled';
import { FormattedMessage, defineMessages } from 'react-intl';
import { get } from 'lodash';
import sanitizeHtml from 'sanitize-html';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import Container from '../components/Container';
import RedeemForm from '../components/RedeemForm';
import RedeemSuccess from '../components/RedeemSuccess';
import { P, H1, H5 } from '../components/Text';

import { isValidEmail } from '../lib/utils';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import withLoggedInUser from '../lib/withLoggedInUser';

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
    getLoggedInUser: PropTypes.func.isRequired, // from withLoggedInUser
    intl: PropTypes.object.isRequired, // from withIntl
    claimPaymentMethod: PropTypes.func.isRequired, // from redeemMutation
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
        defaultMessage: 'Invalid gift card code',
      },
    });
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = await getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  async claimPaymentMethod() {
    this.setState({ loading: true });
    const { code, email, name } = this.state.form;
    const user = { email, name };
    try {
      const res = await this.props.claimPaymentMethod(code, user);
      console.log('>>> res graphql: ', JSON.stringify(res, null, '  '));
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
    if (!isValidEmail(this.state.form.email)) {
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
    const { code, email, name } = this.props;

    return (
      <div className="RedeemedPage">
        <Header
          title="Redeem gift card"
          description="Use your gift card to support open source projects that you are contributing to."
          LoggedInUser={this.state.LoggedInUser}
        />
        <Body>
          <Flex alignItems="center" flexDirection="column">
            <Hero
              minHeight={['500px', null, '700px']}
              backgroundSize={['auto 300px', 'auto 380px']}
            >
              <Flex alignItems="center" flexDirection="column">
                <Box mt={5}>
                  <Title fontSize={['3rem', null, '4rem']}>
                    Redeem Gift Card
                  </Title>
                </Box>

                <Box mt={2}>
                  <Subtitle
                    fontSize={['1.5rem', null, '2rem']}
                    maxWidth={['90%', '640px']}
                  >
                    <Box>
                      <FormattedMessage
                        id="redeem.subtitle.line1"
                        defaultMessage="Open Collective helps communities - like open source projects, meetups, etc - raise money and operate transparently."
                      />
                    </Box>
                  </Subtitle>
                </Box>

                <Box mt={[4, 5]}>
                  <Flex justifyContent="center" flexDirection="column">
                    <Container
                      background="white"
                      borderRadius="16px"
                      width="400px"
                    >
                      <ShadowBox py="24px" px="32px">
                        {this.state.view === 'form' && (
                          <RedeemForm
                            code={code}
                            name={name}
                            email={email}
                            onChange={this.handleChange}
                          />
                        )}
                        {this.state.view === 'success' && (
                          <RedeemSuccess email={email} />
                        )}
                      </ShadowBox>
                    </Container>
                    {this.state.view === 'form' && (
                      <Box my={3} align="center">
                        <BlueButton
                          onClick={this.handleSubmit}
                          disabled={this.state.loading}
                        >
                          {this.state.loading ? (
                            <FormattedMessage
                              id="form.processing"
                              defaultMessage="processing"
                            />
                          ) : (
                            <FormattedMessage
                              id="redeem.form.redeem.btn"
                              defaultMessage="redeem"
                            />
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
      return await mutate({ variables: { code, user } });
    },
  }),
});

export default withData(withIntl(withLoggedInUser(addMutation(RedeemPage))));
