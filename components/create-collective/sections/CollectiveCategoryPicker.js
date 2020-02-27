import React from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';
import { defineMessages, injectIntl } from 'react-intl';
import themeGet from '@styled-system/theme-get';

import { H1 } from '../../Text';
import StyledButton from '../../StyledButton';
import Container from '../../Container';

import { Router } from '../../../server/pages';

const ExamplesLink = styled.a`
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
      header: { id: 'createCollective.header.create', defaultMessage: 'Create a Collective' },
      examples: { id: 'createCollective.examples', defaultMessage: 'See examples' },
    });
  }

  handleChange(fieldname, value) {
    this.props.onChange(fieldname, value);
  }

  changeRoute = async params => {
    params = {
      ...params,
      verb: this.props.query.verb,
      hostCollectiveSlug: this.props.query.hostCollectiveSlug || undefined,
    };
    await Router.pushRoute('new-create-collective', params);
    window.scrollTo(0, 0);
  };

  render() {
    const { intl } = this.props;

    return (
      <div>
        <Box my={4}>
          <H1
            fontSize={['H5', 'H3', null, null]}
            lineHeight={['H5', 'H3', null, null]}
            fontWeight="bold"
            color="black.900"
            textAlign="center"
          >
            {intl.formatMessage(this.messages.header)}{' '}
          </H1>
        </Box>
        <Flex flexDirection="column" justifyContent="center" alignItems="center" mb={[5, 6]}>
          <Box alignItems="center">
            <Flex justifyContent="center" alignItems="center" flexDirection={['column', 'row']}>
              <Container alignItems="center" width={[null, 280, 312, null]} mb={[4, 0, null, null]}>
                <Flex flexDirection="column" justifyContent="center" alignItems="center">
                  <Image
                    className="categoryImage"
                    src="/static/images/createcollective-opensource.png"
                    alt={intl.formatMessage(this.messages.opensource)}
                  />
                  <StyledButton
                    buttonSize="small"
                    height="35px"
                    buttonStyle="primary"
                    mt={[2, 3]}
                    mb={2}
                    px={3}
                    onClick={() => {
                      this.handleChange('category', 'opensource');
                      this.changeRoute({ category: 'opensource' });
                    }}
                  >
                    {intl.formatMessage(this.messages.opensource)}
                  </StyledButton>
                  <ExamplesLink href="#">{intl.formatMessage(this.messages.examples)}</ExamplesLink>
                </Flex>
              </Container>
              <Container
                borderLeft={['none', '1px solid #E6E8EB', null]}
                borderTop={['1px solid #E6E8EB', 'none', null]}
                alignItems="center"
                width={[null, 280, 312, null]}
                mb={[4, 0, null, null]}
              >
                <Flex flexDirection="column" justifyContent="center" alignItems="center">
                  <Image
                    className="categoryImage"
                    src="/static/images/createcollective-anycommunity.png"
                    alt={intl.formatMessage(this.messages.community)}
                  />
                  <StyledButton
                    buttonSize="small"
                    height="35px"
                    buttonStyle="primary"
                    mt={[2, 3]}
                    mb={2}
                    px={3}
                    onClick={() => {
                      this.handleChange('category', 'community');
                      this.changeRoute({ category: 'community' });
                    }}
                  >
                    {intl.formatMessage(this.messages.community)}
                  </StyledButton>
                  <ExamplesLink href="#">{intl.formatMessage(this.messages.examples)}</ExamplesLink>
                </Flex>
              </Container>
              <Container
                borderLeft={['none', '1px solid #E6E8EB', null, null]}
                borderTop={['1px solid #E6E8EB', 'none', null, null]}
                alignItems="center"
                width={[null, 280, 312, null]}
              >
                <Flex flexDirection="column" justifyContent="center" alignItems="center">
                  <Image
                    className="categoryImage"
                    src="/static/images/createcollective-climateinitiative.png"
                    alt={intl.formatMessage(this.messages.climate)}
                  />
                  <StyledButton
                    buttonSize="small"
                    height="35px"
                    buttonStyle="primary"
                    mt={[2, 3]}
                    mb={2}
                    px={3}
                    onClick={() => {
                      this.handleChange('category', 'climate');
                      this.changeRoute({ category: 'climate' });
                    }}
                  >
                    {intl.formatMessage(this.messages.climate)}
                  </StyledButton>
                  <ExamplesLink href="#">{intl.formatMessage(this.messages.examples)}</ExamplesLink>
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
