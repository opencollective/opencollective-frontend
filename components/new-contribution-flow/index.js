import React from 'react';
import PropTypes from 'prop-types';
import { CheckShield } from '@styled-icons/boxicons-regular/CheckShield';
import themeGet from '@styled-system/theme-get';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../../components/Container';
import NewContributeFAQ from '../../components/faqs/NewContributeFAQ';
import { Box, Flex } from '../../components/Grid';
import StyledLink from '../../components/StyledLink';
import { P } from '../../components/Text';

import NewContributionFlowButtons from './ContributionFlowButtons';
import NewContributionFlowHeader from './ContributionFlowHeader';
import NewContributionFlowMainContainer from './ContributionFlowMainContainer';
import NewContributionFlowStepsProgress from './ContributionFlowStepsProgress';

const PROTECTED_TRANSACTIONS_KNOW_MORE_LINK = 'https://www.opencollective.com';

const ProtectTransactionInfoBox = styled(Box)`
  border-radius: 15px;
  background-color: ${themeGet('colors.primary.50')};
  border: 2px solid ${themeGet('colors.primary.600')};
`;

const BlueCheckShield = styled(CheckShield)`
  color: ${themeGet('colors.blue.500')};
`;

const StepsProgressBox = styled(Box)`
  min-height: 95px;
  max-width: 600px;

  @media screen and (max-width: 640px) {
    width: 100%;
    max-width: 100%;
  }
`;

class NewContributionFlowContainer extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    intl: PropTypes.object,
  };

  render() {
    const { collective } = this.props;

    return (
      <Container
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        py={[3, 4]}
        px={[2, 3]}
      >
        <NewContributionFlowHeader collective={collective} />
        <StepsProgressBox mb={[3, null, 4]} width={[1.0, 0.8]}>
          <NewContributionFlowStepsProgress />
        </StepsProgressBox>
        {/* main container */}
        <Flex justifyContent="center" width={1}>
          <Box width={1 / 3} minWidth="335px" />
          <NewContributionFlowMainContainer collective={collective} width={1 / 3} />
          <Flex flexDirection="column" width={1 / 3}>
            <ProtectTransactionInfoBox width={1 / 5} minWidth="335px" ml={4} p={3}>
              <Flex alignItems="center">
                <Box>
                  <BlueCheckShield size={30} />
                </Box>
                <Flex flexDirection="column" mx={2}>
                  <P fontWeight="bold" lineHeight="Paragraph">
                    <FormattedMessage
                      id="NewContributionFlow.ProtectTransactionTitle"
                      defaultMessage="We protect your transaction:"
                    />
                  </P>
                  <P lineHeight="Paragraph">
                    <FormattedMessage
                      id="NewContributionFlow.ProtectTransactionDetails"
                      defaultMessage="In Open Collective, your transaction is safe. {knowMoreLink}"
                      values={{
                        knowMoreLink: (
                          <StyledLink href={PROTECTED_TRANSACTIONS_KNOW_MORE_LINK} openInNewTab>
                            <FormattedMessage id="KnowMore" defaultMessage="Know more." />
                          </StyledLink>
                        ),
                      }}
                    />
                  </P>
                </Flex>
              </Flex>
            </ProtectTransactionInfoBox>
            <NewContributeFAQ mt={4} ml={4} display={['none', null, 'block']} width={1 / 5} minWidth="335px" />
          </Flex>
        </Flex>
        {/* main container */}
        <NewContributionFlowButtons collectiveSlug={collective.slug} />
      </Container>
    );
  }
}

export default injectIntl(NewContributionFlowContainer);
