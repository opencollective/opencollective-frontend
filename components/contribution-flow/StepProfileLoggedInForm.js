import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';

import { Box } from '../Grid';

import ContributeProfilePicker from './ContributeProfilePicker';
import StepProfileInfoMessage from './StepProfileInfoMessage';

export const NEW_ORGANIZATION_KEY = 'newOrg';

const NewContributionFlowStepProfileLoggedInForm = ({
  profiles,
  defaultSelectedProfile,
  onChange,
  canUseIncognito,
  collective,
  // data,
  // stepDetails,
}) => {
  // set initial default profile so it shows in Steps Progress as well
  // TODO: This looks like a hack. Why is the state not set in an upper component?
  useEffect(() => {
    onChange({ stepProfile: defaultSelectedProfile, stepPayment: null, stepSummary: null });
  }, [defaultSelectedProfile]);

  // const totalAmount = getTotalAmount(stepDetails);
  return (
    <Fragment>
      <Box mb={4}>
        <ContributeProfilePicker
          account={collective}
          profiles={profiles}
          canUseIncognito={canUseIncognito}
          defaultSelectedProfile={defaultSelectedProfile}
          onChange={profile => {
            onChange({ stepProfile: profile });
          }}
        />
      </Box>
      {/* TODO: The code to require legal name/address will be implemented in a followup PR */}
      {/* {contributionRequiresIdentity(totalAmount) && (
        <React.Fragment>
          <Flex alignItems="center" my="14px">
            <P fontSize="24px" lineHeight="32px" fontWeight="500" mr={2}>
              <FormattedMessage id="collective.address.label" defaultMessage="Address" />
            </P>
            <Span mr={2} lineHeight="0">
              <PrivateInfoIcon size="14px" tooltipProps={{ containerLineHeight: '0' }} />
            </Span>
            <StyledHr my="18px" borderColor="black.300" width="100%" />
          </Flex>
          <StyledInputLocation
            autoDetectCountry
            location={data?.location}
            onChange={value => dispatchChange('location', value)}
            labelFontSize="16px"
            labelFontWeight="700"
          />
        </React.Fragment>
      )} */}
      <StepProfileInfoMessage />
    </Fragment>
  );
};

NewContributionFlowStepProfileLoggedInForm.propTypes = {
  data: PropTypes.object,
  stepDetails: PropTypes.object,
  onChange: PropTypes.func,
  defaultSelectedProfile: PropTypes.object,
  profiles: PropTypes.array,
  canUseIncognito: PropTypes.bool,
  collective: PropTypes.object,
};

export default NewContributionFlowStepProfileLoggedInForm;
