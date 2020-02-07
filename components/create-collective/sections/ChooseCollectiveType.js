import React, { Fragment } from 'react';
import themeGet from '@styled-system/theme-get';
import { H1, H3 } from '../../Text';
import StyledButton from '../../StyledButton';
import Illustration from '../../home/HomeIllustration';
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';

class CreateCollective extends React.Component {
  render() {
    const ExamplesLink = styled.a`
      color: ${themeGet('colors.blue.500')};

      &:hover {
        color: #dc5f7d;
      }
    `;

    return (
      <Fragment>
        <Flex flexDirection="column" justifyContent="center" alignItems="center" p={5}>
          <H1 fontSize={['H3', null, 'H1']} lineHeight={['H3', null, 'H1']} fontWeight="bold" textAlign="center" mb={4}>
            <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
          </H1>
          <Box alignItems="center" p={3}>
            <Flex justifyContent="center" alignItems="center" p={4}>
              <Box alignItems="center" width={['400px']} p={3}>
                <Flex flexDirection="column" justifyContent="center" alignItems="center" p={1}>
                  <Illustration
                    src="/static/images/createcollective-opensource.png"
                    display={['none', null, null, 'block']}
                    alt="For open source projects"
                  />
                  <StyledButton buttonSize="large" buttonStyle="primary" mb={4} px={4}>
                    <FormattedMessage id="createCollective.opensource" defaultMessage="For open source projects" />
                  </StyledButton>
                  <ExamplesLink href="#">
                    <FormattedMessage id="createCollective.examples" defaultMessage="See examples" />
                  </ExamplesLink>
                </Flex>
              </Box>
              <Box alignItems="center" width={['400px']} p={3}>
                <Flex flexDirection="column" justifyContent="center" alignItems="center" p={1}>
                  <Illustration
                    src="/static/images/createcollective-anycommunity.png"
                    display={['none', null, null, 'block']}
                    alt="For any community"
                  />
                  <StyledButton buttonSize="large" buttonStyle="primary" mb={4} px={4}>
                    <FormattedMessage id="createCollective.anycommunity" defaultMessage="For any community" />
                  </StyledButton>
                  <ExamplesLink href="#">
                    <FormattedMessage id="createCollective.examples" defaultMessage="See examples" />
                  </ExamplesLink>
                </Flex>
              </Box>
              <Box alignItems="center" width={['400px']} p={3}>
                <Flex flexDirection="column" justifyContent="center" alignItems="center" p={1}>
                  <Illustration
                    src="/static/images/createcollective-climateinitiative.png"
                    display={['none', null, null, 'block']}
                    alt="For climate initiatives"
                  />
                  <StyledButton buttonSize="large" buttonStyle="primary" mb={4} px={4}>
                    <FormattedMessage id="createCollective.climate" defaultMessage="For climate initiatives" />
                  </StyledButton>
                  <ExamplesLink href="#">
                    <FormattedMessage id="createCollective.examples" defaultMessage="See examples" />
                  </ExamplesLink>
                </Flex>
              </Box>
            </Flex>
          </Box>
        </Flex>
        ;
      </Fragment>
    );
  }
}

export default CreateCollective;
