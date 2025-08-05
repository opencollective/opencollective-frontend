import React from 'react';
import { PlusCircle } from '@styled-icons/feather/PlusCircle';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '../lib/constants/collectives';

import { Box, Flex, Grid } from './Grid';
import StyledButton from './StyledButton';

/** Return the caption associated to a given collective type */
const getTypeCaption = (type, { useBeneficiaryForVendor = false }) => {
  if (type === CollectiveType.USER) {
    return <FormattedMessage id="User.InviteNew" defaultMessage="Invite new User" />;
  } else if (type === CollectiveType.ORGANIZATION) {
    return <FormattedMessage id="organization.create" defaultMessage="Create Organization" />;
  } else if (type === CollectiveType.COLLECTIVE) {
    return <FormattedMessage id="collective.create" defaultMessage="Create Collective" />;
  } else if (type === CollectiveType.VENDOR) {
    return useBeneficiaryForVendor ? (
      <FormattedMessage defaultMessage="Create Beneficiary" id="AzRKUx" />
    ) : (
      <FormattedMessage defaultMessage="Create Vendor" id="I5p2+k" />
    );
  } else {
    return null;
  }
};

/**
 * A component showing big buttons to pick between collective types (user, org...etc)
 */
const CollectiveTypePicker = ({
  types = [CollectiveType.USER, CollectiveType.COLLECTIVE, CollectiveType.ORGANIZATION],
  onChange,
  useBeneficiaryForVendor,
}) => {
  const isSingleType = types.length === 1;
  return (
    <Grid gridGap={1} gridTemplateColumns={`repeat(${types.length}, 1fr)`}>
      {types.map(type => (
        <StyledButton
          key={type}
          borderRadius="14px"
          onClick={() => onChange(type)}
          data-cy={`collective-type-picker-${type}`}
          type="button"
        >
          <Flex alignItems="center" flexDirection={isSingleType ? 'row' : 'column'}>
            <PlusCircle size={24} />
            <Box ml={isSingleType ? '16px' : 0} fontSize="11px">
              {getTypeCaption(type, { useBeneficiaryForVendor })}
            </Box>
          </Flex>
        </StyledButton>
      ))}
    </Grid>
  );
};

export default CollectiveTypePicker;
