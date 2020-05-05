import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Container from './Container';
import { Box } from './Grid';
import Link from './Link';
import { H2 } from './Text';

const LinkAction = styled(Link)`
  text-align: center;
  color: #090a0a;
`;

const Title = styled(H2)`
  font-size: 4rem !important;
`;

const Subtitle = styled(Container)`
  color: #71757a;
  margin-top: 0.8rem;
  font-size: 1.6rem;
  line-height: 19px;
  text-align: center;
`;

class SectionTitle extends React.Component {
  static propTypes = {
    title: PropTypes.node,
    subtitle: PropTypes.node,
    values: PropTypes.object,
    action: PropTypes.object, // { label, href }
  };

  render() {
    const { action } = this.props;
    const title = this.props.title;
    const subtitle = this.props.subtitle;
    return (
      <Container textAlign="center" className="SectionTitle">
        <style jsx>
          {`
            .SectionTitle {
              margin-top: 4rem;
              overflow: hidden;
              text-align: center;
              margin-bottom: 7.2rem;
            }
            .SectionTitle .title :global(.action) {
              font-size: 1.4rem;
            }
            h1 {
              margin: 0;
              text-align: center;
            }
            .content {
              padding: 0.8rem 0;
            }
          `}
        </style>

        <Container className="content">
          <Box mt={2} mb={3}>
            <Title>{title}</Title>
          </Box>
          {action && (
            <LinkAction route={action.href} className="action" scroll={false}>
              {action.label}
            </LinkAction>
          )}
          {subtitle && <Subtitle data-cy="subtitle">{subtitle}</Subtitle>}
        </Container>
      </Container>
    );
  }
}

export default SectionTitle;
