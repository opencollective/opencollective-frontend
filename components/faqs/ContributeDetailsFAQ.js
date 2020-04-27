import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import Container from '../Container';

import FAQ, { Content, Entry, Title } from './FAQ';

/**
 * FAQ associated to the `ContributeDetails` component.
 */
const ContributeDetailsFAQ = ({ tax, isIncognito, hasInterval, ...props }) =>
  !tax && !hasInterval && !isIncognito ? (
    <Container {...props} />
  ) : (
    <FAQ {...props}>
      {isIncognito && (
        <Entry>
          <Title>
            <FormattedMessage
              id="ContributeDetails.faq.isIncognito.title"
              defaultMessage="What is an incognito contribution?"
            />
          </Title>
          <Content>
            <FormattedMessage
              id="ContributeDetails.faq.isIncognito.content"
              defaultMessage={
                'If you chose to contribute as "incognito", your financial contribution will show up publicly as an incognito donation and it won\'t link to your public profile. However, in the effort of being transparent and compliant with KYC regulations (Know Your Customer), the fiscal host and the administrators of the collective can export a list of all the financial contributors with their personal information.'
              }
            />
          </Content>
        </Entry>
      )}
      {hasInterval && (
        <Entry>
          <Title>
            <FormattedMessage
              id="ContributeDetails.faq.frequency.title"
              defaultMessage="When will I be billed next time?"
            />
          </Title>
          <Content>
            <FormattedMessage
              id="ContributeDetails.faq.frequency.content"
              defaultMessage="You will be charged today, and then on the 1st of each month (for monthly contributions) or the 1st of the same month next year (for yearly contributions). Note: To prevent you from being charged twice in a short time frame, if you contribute after the 15th of a given month, the next charge will not be the 1st of next month but the month after."
            />
          </Content>
        </Entry>
      )}
      {tax && (
        <Entry>
          <Title>{get(tax, 'help.title')}</Title>
          <Content>{get(tax, 'help.instructions')}</Content>
        </Entry>
      )}
    </FAQ>
  );

ContributeDetailsFAQ.propTypes = {
  isIncognito: PropTypes.bool,
  hasInterval: PropTypes.bool,
  tax: PropTypes.shape({
    help: PropTypes.shape({
      title: PropTypes.string,
      instructions: PropTypes.string,
    }),
  }),
};

export default ContributeDetailsFAQ;
