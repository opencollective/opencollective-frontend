import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import themeGet from '@styled-system/theme-get';
import StyledButton from '../../StyledButton';
import Illustration from '../../home/HomeIllustration';
import styled from 'styled-components';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';

class CollectiveCategoryPicker extends React.Component {
  static propTypes = {
    categories: PropTypes.arrayOf(PropTypes.string),
    defaultValue: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { category: null };
    this.handleChange = this.handleChange.bind(this);

    this.messages = defineMessages({
      'category.label': {
        id: 'collective.category.label',
        defaultMessage: 'Category',
      },
      community: {
        id: 'collective.category.community',
        defaultMessage: 'For any community',
      },
      opensource: {
        id: 'collective.category.newopensource',
        defaultMessage: 'For open source projects',
      },
      climate: { id: 'collective.category.climate', defaultMessage: 'For climate initiatives' },
    });
  }

  handleChange(category) {
    this.setState({ category });
    this.props.onChange(category);
  }

  render() {
    const { intl } = this.props;

    const boxStyle = {
      borderLeft: '1px solid lightgray',
    };

    const ExamplesLink = styled.a`
      color: ${themeGet('colors.blue.500')};

      &:hover {
        color: #dc5f7d;
      }
    `;

    return (
      <div className="CollectiveCategoryPicker">
        <Flex flexDirection="column" justifyContent="center" alignItems="center" p={2}>
          <Box alignItems="center" p={3}>
            <Flex justifyContent="center" alignItems="center" p={4}>
              {!this.state.category && (
                <Fragment>
                  <Box alignItems="center" width={['400px']} p={3}>
                    <Flex flexDirection="column" justifyContent="center" alignItems="center" p={1}>
                      <Illustration
                        src="/static/images/createcollective-opensource.png"
                        display={['none', null, null, 'block']}
                        alt="For open source projects"
                      />
                      <StyledButton
                        buttonSize="large"
                        buttonStyle="primary"
                        mb={4}
                        px={4}
                        onClick={() => this.handleChange('opensource')}
                      >
                        {intl.formatMessage(this.messages.opensource)}
                      </StyledButton>
                      <ExamplesLink href="#">
                        <FormattedMessage id="createCollective.examples" defaultMessage="See examples" />
                      </ExamplesLink>
                    </Flex>
                  </Box>
                  <Box alignItems="center" width={['400px']} p={3} style={boxStyle}>
                    <Flex flexDirection="column" justifyContent="center" alignItems="center" p={1}>
                      <Illustration
                        src="/static/images/createcollective-anycommunity.png"
                        display={['none', null, null, 'block']}
                        alt="For any community"
                      />
                      <StyledButton
                        buttonSize="large"
                        buttonStyle="primary"
                        mb={4}
                        px={4}
                        onClick={() => this.handleChange('community')}
                      >
                        {intl.formatMessage(this.messages.community)}{' '}
                      </StyledButton>
                      <ExamplesLink href="#">
                        <FormattedMessage id="createCollective.examples" defaultMessage="See examples" />
                      </ExamplesLink>
                    </Flex>
                  </Box>
                  <Box alignItems="center" width={['400px']} p={3} style={boxStyle}>
                    <Flex flexDirection="column" justifyContent="center" alignItems="center" p={1}>
                      <Illustration
                        src="/static/images/createcollective-climateinitiative.png"
                        display={['none', null, null, 'block']}
                        alt="For climate initiatives"
                      />
                      <StyledButton
                        buttonSize="large"
                        buttonStyle="primary"
                        mb={4}
                        px={4}
                        onClick={() => this.handleChange('climate')}
                      >
                        {intl.formatMessage(this.messages.climate)}{' '}
                      </StyledButton>
                      <ExamplesLink href="#">
                        <FormattedMessage id="createCollective.examples" defaultMessage="See examples" />
                      </ExamplesLink>
                    </Flex>
                  </Box>
                </Fragment>
              )}

              {this.state.category && (
                <div>
                  <label>{intl.formatMessage(this.messages['category.label'])}:</label>
                  {intl.formatMessage(this.messages[this.state.category])} (
                  <a onClick={() => this.handleChange(null)}>change</a>)
                </div>
              )}
            </Flex>
          </Box>
        </Flex>
      </div>
    );
  }
}

export default injectIntl(CollectiveCategoryPicker);
