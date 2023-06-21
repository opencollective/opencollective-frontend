import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { PreviewFeature } from '../lib/preview-features';

import { Flex } from './Grid';
import InputSwitch from './InputSwitch';
import Link from './Link';
import StyledCard from './StyledCard';
import StyledModal, { ModalBody, ModalHeader } from './StyledModal';
import StyledTag from './StyledTag';
import { H2, H4, P } from './Text';

const editAccountSettingsMutation = gql`
  mutation EditAccountSettings($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

const PreviewFeatureCard = ({ feature }: { feature: PreviewFeature }) => {
  const { LoggedInUser, refetchLoggedInUser } = useLoggedInUser();
  const [isChecked, setIsChecked] = React.useState(LoggedInUser.hasPreviewFeatureEnabled(feature.key));
  const [loading, setLoading] = React.useState(false);
  const [submitEditSettings] = useMutation(editAccountSettingsMutation, {
    context: API_V2_CONTEXT,
  });

  const togglePreviewFeature = async (featureKey, checked) => {
    setIsChecked(checked);
    setLoading(true);
    await submitEditSettings({
      variables: {
        account: { slug: LoggedInUser.collective.slug },
        key: `earlyAccess.${featureKey}`,
        value: checked,
      },
    });
    await refetchLoggedInUser();
    setLoading(false);
  };

  return (
    <StyledCard mt={3} key={feature.title} display="flex" justifyContent="space-between" p={'20px'}>
      <Flex flexDirection="column">
        <H4 fontSize="18px" fontWeight={700} letterSpacing="0" color="black.700" mb={1}>
          {feature.title}{' '}
          <StyledTag
            variant="rounded"
            type={feature.publicBeta ? 'success' : 'info'}
            fontWeight={600}
            fontSize="12px"
            p="4px 8px"
            ml={1}
            verticalAlign="middle"
          >
            {feature.publicBeta ? (
              <FormattedMessage id="PreviewFeatures.publicBeta" defaultMessage="Public Beta" />
            ) : (
              <FormattedMessage id="PreviewFeatures.closedBeta" defaultMessage="Closed Beta" />
            )}
          </StyledTag>
        </H4>
        <P fontSize="14px" lineHeight="20px" fontWeight="400" color="black.700" letterSpacing={0}>
          {feature.description}
        </P>
      </Flex>
      <InputSwitch
        checked={isChecked}
        disabled={loading}
        onChange={e => togglePreviewFeature(feature.key, e.target.checked)}
      />
    </StyledCard>
  );
};

const PreviewFeaturesModal = ({ onClose }: { onClose: () => void }) => {
  const { LoggedInUser } = useLoggedInUser();
  const previewFeatures = LoggedInUser?.getAvailablePreviewFeatures() || [];

  return (
    <StyledModal onClose={onClose} width="576px">
      <ModalHeader onClose={onClose}>
        <Flex width="100%" flexDirection="column">
          <H2 fontSize={'20px'} fontWeight="700" lineHeight="36px" color="black.800" mb={2}>
            <FormattedMessage id="PreviewFeatures" defaultMessage="Preview Features" />
          </H2>
          <P fontSize="14px" lineHeight="20px" fontWeight="400" color="black.700" letterSpacing={0}>
            <FormattedMessage
              id="PreviewFeatures.description"
              defaultMessage="Get early access to features that are in development. Please <ContactLink>let us know</ContactLink> how we can make them better."
              values={{
                ContactLink: msg => <Link href="/contact">{msg}</Link>,
              }}
            />
          </P>
        </Flex>
      </ModalHeader>
      <ModalBody mb={2}>
        {previewFeatures?.map(feature => (
          <PreviewFeatureCard key={feature.key} feature={feature} />
        ))}
      </ModalBody>
    </StyledModal>
  );
};

export default PreviewFeaturesModal;
