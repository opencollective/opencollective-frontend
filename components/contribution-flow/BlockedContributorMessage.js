import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { MODERATION_CATEGORIES } from '../../lib/constants/moderation-categories';

import { Flex } from '../../components/Grid';

import { I18nSupportLink } from '../I18nFormatters';
import MessageBox from '../MessageBox';

const BlockedContributorMessage = ({ categories, collective }) => {
  return (
    <MessageBox type="warning" withIcon>
      <FormattedMessage
        id="NewContributionFlow.BlockedContributor.Details"
        defaultMessage="{collective} has requested not to receive donations from this account because it has been categorized as: {categories}"
        values={{
          collective: collective.name,
          categories: (
            <Flex mt={2}>
              <ul>
                {categories.map(index => {
                  return <li key={index}>{MODERATION_CATEGORIES[index]}</li>;
                })}
              </ul>
            </Flex>
          ),
        }}
      />
      {collective.contributionPolicy && (
        <FormattedMessage
          id="NewContributionFlow.BlockedContributor.ContributionPolicy"
          defaultMessage="Their contribution policy is as follows: {contributionPolicy}"
          values={{
            contributionPolicy: (
              <Flex my={2}>
                <em>{collective.contributionPolicy}</em>
              </Flex>
            ),
          }}
        />
      )}
      <FormattedMessage
        id="NewContributionFlow.BlockedContributor.Support"
        defaultMessage="If you have any questions please contact <I18nSupportLink>support</I18nSupportLink>."
        values={{
          I18nSupportLink,
        }}
      />
    </MessageBox>
  );
};
BlockedContributorMessage.propTypes = {
  categories: PropTypes.array,
  collective: PropTypes.shape({
    contributionPolicy: PropTypes.string,
    name: PropTypes.string,
  }),
};

export default BlockedContributorMessage;
