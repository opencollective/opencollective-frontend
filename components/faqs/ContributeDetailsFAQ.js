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
                'Publicly, the contribution amount and date will be visible in the transparent budget, but your identity will be obscured, appearing only as "incognito". The contribution will not be linked to your public profile. However, the admins will be able to see your identity privately.'
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
              defaultMessage="When will I be charged?"
            />
          </Title>
          <Content>
            <FormattedMessage
              id="ContributeDetails.faq.frequency.content"
              defaultMessage="You will be charged today, and then going forward on the 1st of each month (or the 1st of the same month for yearly contributions). To avoid two charges in a short time frame, recurring contributions started after the 15th will not be charged again until the next subsequent month, e.g. if the initial charge is on April 16 the second charge will be on June 1."
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
