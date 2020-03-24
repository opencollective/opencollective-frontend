import React from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';
import { defineMessages, injectIntl } from 'react-intl';
import themeGet from '@styled-system/theme-get';

import { H1 } from '../Text';
import StyledButton from '../StyledButton';
import Container from '../Container';
import Link from '../Link';
import ExternalLink from '../ExternalLink';

const ExamplesLink = styled(ExternalLink)`
  color: ${themeGet('colors.blue.500')};
  font-size: ${themeGet('fontSizes.Caption')}px;

  &:hover {
    color: #dc5f7d;
  }
`;

const Image = styled.img`
  @media screen and (min-width: 52em) {
    height: 256px;
    width: 256px;
  }
  @media screen and (max-width: 40em) {
    height: 192px;
    width: 192px;
  }
  @media screen and (min-width: 40em) and (max-width: 52em) {
    height: 208px;
    width: 208px;
  }
`;

class CollectiveCategoryPicker extends React.Component {
  static propTypes = {
    query: PropTypes.object,
    defaultValue: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    subtitle: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = { category: null };
    this.handleChange = this.handleChange.bind(this);

    this.messages = defineMessages({
      community: {
        id: 'createCollective.category.community',
        defaultMessage: 'For any community',
      },
      opensource: {
        id: 'createCollective.category.newOpenSource',
        defaultMessage: 'For open source projects',
      },
      climate: { id: 'createCollective.category.climate', defaultMessage: 'For climate initiatives' },
      covid: { id: 'createCollective.category.covid', defaultMessage: 'For COVID-19 initiatives' },
      header: { id: 'createCollective.header.create', defaultMessage: 'Create a Collective' },
      examples: { id: 'createCollective.examples', defaultMessage: 'See examples' },
    });
  }

  handleChange(fieldname, value) {
    this.props.onChange(fieldname, value);
  }

  render() {
    const { intl, query } = this.props;

    return (
      <div>
        <Box mb={4} mt={5}>
          <H1 fontSize={['H5', 'H3']} lineHeight={['H5', 'H3']} fontWeight="bold" color="black.900" textAlign="center">
            {intl.formatMessage(this.messages.header)}
          </H1>
        </Box>
        <Flex flexDirection="column" justifyContent="center" alignItems="center" mb={[5, 6]}>
          <Box alignItems="center">
            <Flex justifyContent="center" alignItems="center" flexDirection={['column', 'row']}>
              <Container alignItems="center" width={[null, 280, 312]} mb={[4, 0]}>
                <Flex flexDirection="column" justifyContent="center" alignItems="center">
                  <Image
                    src="/static/images/create-collective/openSourceIllustration.png"
                    alt={intl.formatMessage(this.messages.opensource)}
                  />
                  <Link
                    route="create-collective"
                    params={{
                      hostCollectiveSlug: query.hostCollectiveSlug,
                      verb: query.verb,
                      category: 'opensource',
                    }}
                  >
                    <StyledButton
                      fontSize="13px"
                      buttonStyle="primary"
                      minHeight="36px"
                      mt={[2, 3]}
                      mb={3}
                      px={3}
                      onClick={() => {
                        this.handleChange('category', 'opensource');
                      }}
                    >
                      {intl.formatMessage(this.messages.opensource)}
                    </StyledButton>
                  </Link>
                  <ExamplesLink href="/discover?show=opensource" openInNewTab>
                    {intl.formatMessage(this.messages.examples)}
                  </ExamplesLink>
                </Flex>
              </Container>
              <Container
                borderLeft={['none', '1px solid #E6E8EB']}
                borderTop={['1px solid #E6E8EB', 'none']}
                alignItems="center"
                width={[null, 280, 312]}
              >
                <Flex flexDirection="column" justifyContent="center" alignItems="center">
                  <Image
                    src="/static/images/create-collective/climateIllustration.png"
                    alt={intl.formatMessage(this.messages.covid)}
                  />
                  <Link
                    route="create-collective"
                    params={{
                      hostCollectiveSlug: query.hostCollectiveSlug,
                      verb: query.verb,
                      category: 'covid-19',
                    }}
                  >
                    <StyledButton
                      fontSize="13px"
                      buttonStyle="primary"
                      minHeight="36px"
                      mt={[2, 3]}
                      mb={3}
                      px={3}
                      onClick={() => {
                        this.handleChange('category', 'covid-19');
                      }}
                    >
                      {intl.formatMessage(this.messages.covid)}
                    </StyledButton>
                  </Link>
                  <ExamplesLink href="/discover?show=covid-19" openInNewTab>
                    {intl.formatMessage(this.messages.examples)}
                  </ExamplesLink>
                </Flex>
              </Container>
              <Container
                borderLeft={['none', '1px solid #E6E8EB']}
                borderTop={['1px solid #E6E8EB', 'none']}
                alignItems="center"
                width={[null, 280, 312]}
                mb={[4, 0]}
              >
                <Flex flexDirection="column" justifyContent="center" alignItems="center">
                  <Image
                    src="/static/images/create-collective/communityIllustration.png"
                    alt={intl.formatMessage(this.messages.community)}
                  />
                  <Link
                    route="create-collective"
                    params={{
                      hostCollectiveSlug: query.hostCollectiveSlug,
                      verb: query.verb,
                      category: 'community',
                    }}
                  >
                    <StyledButton
                      fontSize="13px"
                      buttonStyle="primary"
                      minHeight="36px"
                      mt={[2, 3]}
                      mb={3}
                      px={3}
                      onClick={() => {
                        this.handleChange('category', 'community');
                      }}
                    >
                      {intl.formatMessage(this.messages.community)}
                    </StyledButton>
                  </Link>
                  <ExamplesLink href="/discover?show=community" openInNewTab>
                    {intl.formatMessage(this.messages.examples)}
                  </ExamplesLink>
                </Flex>
              </Container>
            </Flex>
          </Box>
        </Flex>
      </div>
    );
  }
}

export default injectIntl(CollectiveCategoryPicker);
