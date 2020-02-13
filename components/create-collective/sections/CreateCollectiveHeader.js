import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import { H1, Span } from '../../Text';
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';

class CreateCollectiveHeader extends React.Component {
  static propTypes = {
    subheader: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = { subheader: this.props.subheader || null };
  }

  render() {
    return (
      <Fragment>
        <Flex flexDirection="column" justifyContent="center" alignItems="center" p={4} mt={2}>
          <H1 fontSize={['H3', null, 'H1']} lineHeight={['H3', null, 'H1']} fontWeight="bold" textAlign="center" mb={2}>
            <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
          </H1>
          {this.state.subheader && <Span>{this.state.subheader}</Span>}
        </Flex>
      </Fragment>
    );
  }
}

export default CreateCollectiveHeader;
