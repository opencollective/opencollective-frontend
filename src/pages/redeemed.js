import React from 'react'

import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectivesWithData from '../components/CollectivesWithData';
import withLoggedInUser from '../lib/withLoggedInUser';
import withIntl from '../lib/withIntl';
import withData from '../lib/withData'
import colors from '../constants/colors';

import Container from '../components/Container';
import Button from '../components/Button';
import { P, H1, H5 } from '../components/Text';
import { Flex, Box } from 'grid-styled';
import { FormattedMessage, defineMessages } from 'react-intl';

import GiftCard from '../components/GiftCard';
import SearchForm from '../components/SearchForm';
import styled from 'styled-components';
import { backgroundSize, fontSize, minHeight, maxWidth } from 'styled-system';

const Title = styled(H1)`
  color: white;
  ${fontSize};
`;

const Subtitle = styled(H5)`
  color: white;
  ${fontSize};
  ${maxWidth};
`;

const SearchFormContainer = styled(Box)`
  margin: 64px auto;
  text-align: center;
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


class RedeemedPage extends React.Component {

  static getInitialProps ({ query: { shortUUID } }) {
    return { shortUUID };
  }

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {
      loading: false,
      view: 'form',
      form: {},
      LoggedInUser: null,
    };

    this.messages = defineMessages({
      'email': { id: 'user.email.label', defaultMessage: 'email' },
      'code': { id: 'redeem.form.code.label', defaultMessage: 'Gift card code' },
    });

  }

  async componentDidMount() {
    const { getLoggedInUser } = this.props;
    const LoggedInUser = await getLoggedInUser();
    this.setState({ LoggedInUser });
  }

  async redeem() {
    this.setState({ loading: true });
    if (true) {
      this.setState({ loading: false, view: 'confirmEmail' });
    }
  }

  handleSubmit() {
    this.redeem();
  }

  handleChange(fieldname, value) {
    const { form } = this.state;
    form[fieldname] = value;
    this.setState({ form });
  }

  render() {
    const { LoggedInUser } = this.state;
    const { code } =  this.props;
    const emitter = { slug: 'triplebyte', name: 'Tripebyte' };
    return (
      <div className="RedeemedPage">
        <Header
          title="Gift card redeemed"
          description="Use your gift card to support open source projects that you are contributing to."
          LoggedInUser={this.state.LoggedInUser}
          />

        <Body>
          <Flex alignItems="center" flexDirection="column">

            <Hero minHeight={['300px', null, '380px']} backgroundSize={['auto 300px', 'auto 380px']}>
              <Flex alignItems="center" flexDirection="column">

                <Box mt={5}>
                  <Title fontSize={['3rem', null, '4rem']}>Gift Card Redeemed! 🎉</Title>
                </Box>

                <Box mt={2}>
                  <Subtitle fontSize={['1.5rem', null, '2rem']} maxWidth={['90%', '640px']}>
                    <Box><FormattedMessage id="redeemed.subtitle.line1" defaultMessage="The card has been added to your account." /></Box>
                    <Box><FormattedMessage id="redeemed.subtitle.line2" defaultMessage="You can now donate to any collective of your choice." /></Box>
                  </Subtitle>
                </Box>

                <Box mt={[4,5]}>
                  <GiftCard
                    amount={10000}
                    currency="USD"
                    emitter={emitter}
                    name="Maria"
                    />
                </Box>
              </Flex>
            </Hero>

            <Box width={['320px', '640px']}>
              <SearchFormContainer>
                <Box mb={3}>
                  <H5><FormattedMessage id="redeemed.findCollectives" defaultMessage="Find open collectives to support." /></H5>
                </Box>
                <SearchForm fontSize="1.4rem" />
              </SearchFormContainer>
            </Box>

            <P color="#76777A" textAlign="center">
              <FormattedMessage id="redeemed.suggestions" defaultMessage="or you can choose from these awesome collectives that are doing great work:" />
            </P>

            <Box mb={5}>
              <Container maxWidth="1200px">
                <CollectivesWithData
                  HostCollectiveId={11004} // hard-coded to only show open source projects
                  orderBy="balance"
                  orderDirection="DESC"
                  limit={12}
                  />
              </Container>
            </Box>
          </Flex>

        </Body>
        <Footer />

      </div>
    );
  }
}


export default withData(withLoggedInUser(withIntl(RedeemedPage)));
