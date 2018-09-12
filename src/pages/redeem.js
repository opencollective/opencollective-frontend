import React from 'react';

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import withLoggedInUser from '../lib/withLoggedInUser';
import withIntl from '../lib/withIntl';
import withData from '../lib/withData';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import Container from '../components/Container';
// import Button from '../components/Button';
import { Flex, Box } from 'grid-styled';
import { FormattedMessage, defineMessages } from 'react-intl';

import RedeemForm from '../components/RedeemForm';
import RedeemSuccess from '../components/RedeemSuccess';

import { P, H1, H5 } from '../components/Text';

import styled from 'styled-components';
import { backgroundSize, fontSize, minHeight, maxWidth } from 'styled-system';
import { isValidEmail } from '../lib/utils';
import { get } from 'lodash';

const Error = styled(P)`
  color: red;
`;

const BlueButton = styled.button`
  --webkit-appearance: none;
  width: 336px;
  height: 56px;
  border: none;
  background: #3385FF;
  border-radius: 100px;
  color: white;
  font-size: 1.6rem;
  line-height: 5.2rem;
  text-align:center;
  margin: 16px;
  &&:hover {
    background: #66A3FF;
  }
  &&:active {
    background: #145ECC;
  }
  &&:disabled {
    background: #E0EDFF;
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
  ${backgroundSize}
`;

class RedeemPage extends React.Component {

  static getInitialProps ({ query: { code, email } }) {
    return { code, email };
  }

  constructor(props) {
    super(props);
    const { code, email } = props;
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {
      loading: false,
      view: 'form', // form or success
      form: { code, email },
      LoggedInUser: null,
    };
    this.messages = defineMessages({
      'error.email.invalid': { id: 'error.email.invalid', defaultMessage: 'Invalid email address' },
      'error.code.invalid': { id: 'error.code.invalid', defaultMessage: 'Invalid gift card code' },
    });
  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = await getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  async claimVirtualCard() {
    this.setState({ loading: true });
    const { code, email } = this.state.form;
    try {
      const res = await this.props.claimVirtualCard(code, email);
      console.log(">>> res graphql: ", JSON.stringify(res, null, '  '));
      this.setState({ loading: false, view: 'success' });
    } catch (e) {
      const error = e.graphQLErrors && e.graphQLErrors[0].message;
      this.setState({ loading: false, error });
      // console.log(">>> error graphql: ", JSON.stringify(error, null, '  '));
      console.log(">>> error graphql: ", error);
    }
  }

  handleSubmit() {
    const { intl } = this.props;
    if (!isValidEmail(this.state.form.email)) {
      return this.setState({ error: intl.formatMessage(this.messages['error.email.invalid']) });
    }
    if (get(this.state, 'form.code', '').length !== 8) {
      return this.setState({ error: intl.formatMessage(this.messages['error.code.invalid']) });
    }
    this.claimVirtualCard();
  }

  handleChange(form) {
    this.setState({ form, error: null });
  }

  render() {
    const { code, email } = this.props;

    return (
      <div className="RedeemedPage">
        <Header
          title="Redeem gift card"
          description="Use your gift card to support open source projects that you are contributing to."
          LoggedInUser={this.state.LoggedInUser}
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
                    <Box><FormattedMessage id="redeem.subtitle.line1" defaultMessage="Open Collective helps communities - like open source projects, meetups, etc - raise money and operate transparently." /></Box>
                  </Subtitle>
                </Box>

                <Box mt={[4,5]}>

                  <Flex justifyContent="center" flexDirection="column">

                    <Container background="white" borderRadius="16px" width="400px">
                      <ShadowBox py="24px" px="32px">
                        { this.state.view === 'form' && <RedeemForm
                          code={code}
                          email={email}
                          onChange={this.handleChange}
                          />
                        }
                        { this.state.view === 'success' && <RedeemSuccess email={email} /> }
                      </ShadowBox>
                    </Container>
                    { this.state.view === 'form' &&
                      <Box my={3} align="center">
                        <BlueButton onClick={this.handleSubmit} disabled={this.state.loading}>
                          { this.state.loading
                            ? <FormattedMessage id="form.processing" defaultMessage="processing" />
                            : <FormattedMessage id="redeem.form.redeem.btn" defaultMessage="redeem" />
                          }
                        </BlueButton>
                        { this.state.error && <Error>{this.state.error}</Error> }
                      </Box>
                    }
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
mutation claimVirtualCard($code: String!, $email: String) {
  claimVirtualCard(code: $code, email: $email) {
    id
    description
  }
}
`;

const addMutation = graphql(redeemMutation, {
  props: ( { mutate }) => ({
    claimVirtualCard: async (code, email) => {
      return await mutate({ variables: { code, email } });
    },
  }),
});

export default withData(withLoggedInUser(withIntl(addMutation(RedeemPage))));
