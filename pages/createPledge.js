import React from 'react';
import { FormattedMessage } from 'react-intl';

import Container from '../components/Container';
import MessageBox from '../components/MessageBox';
import Page from '../components/Page';
import { H3 } from '../components/Text';

class CreatePledgePage extends React.Component {
  render() {
    return (
      <Page>
        <Container mx="auto" p={5} flexDirection="column" justifyContent="space-around" maxWidth="1200px" clearfix>
          <H3 as="h1" color="black.900" textAlign="left" mb={4}>
            <FormattedMessage id="menu.createPledge" defaultMessage="Make a Pledge" />
          </H3>

          <MessageBox type="info" withIcon width="fit-content">
            The Pledges feature is being deprecated.
            <br />
            If this is blocking you in some way, please share your feedback on{' '}
            <a href="https://github.com/opencollective/opencollective/issues/6590">
              https://github.com/opencollective/opencollective/issues/6590
            </a>
          </MessageBox>
        </Container>
      </Page>
    );
  }
}

export default CreatePledgePage;
