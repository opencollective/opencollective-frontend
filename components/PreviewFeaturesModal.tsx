import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { themeGet } from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { PreviewFeatureType } from '../lib/preview-features';

import { Flex, Box } from './Grid';
import InputSwitch from './InputSwitch';
import Link from './Link';
import StyledCard from './StyledCard';
import StyledModal, { ModalBody, ModalHeader } from './StyledModal';
import { H2, H3, H4, P } from './Text';
import Container from './Container';
import { FlaskConical } from 'lucide-react';
const Pill = styled.div`
  font-size: 12px;
  font-weight: 400;
  border: 1px solid ${props => props.color};
  color: ${props => props.color};
  border-radius: 100px;
  background: white;
  display: inline-block;
  padding: 4px 8px;
  line-height: 12px;
  margin-left: 8px;
  vertical-align: middle;
`;

const editAccountSettingsMutation = gql`
  mutation EditAccountSettings($account: AccountReferenceInput!, $key: AccountSettingsKey!, $value: JSON!) {
    editAccountSetting(account: $account, key: $key, value: $value) {
      id
      settings
    }
  }
`;

const PreviewFeature = ({ feature, disabled = false, child }: { feature: PreviewFeatureType }) => {
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
    <Container
      borderBottom={child ? '1px solid #e5e7eb' : 0}
      key={feature.title}
      p={child ? '12px 16px' : '20px'}
      opacity={disabled ? 0.5 : 1}
    >
      <Flex alignItems="center" justifyContent={'space-between'}>
        <Flex flexDirection="column">
          <H4 fontSize={child ? '14px' : '18px'} fontWeight={child ? 500 : 700} letterSpacing="0" color={'black.700'}>
            {feature.title}
            {!child && (
              <Pill color={feature.publicBeta ? themeGet('colors.green.600') : themeGet('colors.primary.600')}>
                {feature.publicBeta ? (
                  <FormattedMessage id="PreviewFeatures.publicBeta" defaultMessage="Public Beta" />
                ) : (
                  <FormattedMessage id="PreviewFeatures.closedBeta" defaultMessage="Closed Beta" />
                )}
              </Pill>
            )}
          </H4>
          {feature.description && (
            <P fontSize="14px" lineHeight="20px" fontWeight="400" color="black.700" letterSpacing={0} mt={1}>
              {feature.description}
            </P>
          )}
        </Flex>
        <InputSwitch
          checked={isChecked}
          disabled={loading || disabled}
          onChange={e => togglePreviewFeature(feature.key, e.target.checked)}
        />
      </Flex>
      {feature.subFeatures && (
        <React.Fragment>
          <StyledCard mt={3}>
            {feature.subFeatures.map(subFeature => (
              <PreviewFeature key={subFeature.key} feature={subFeature} disabled={!isChecked} child />
            ))}
          </StyledCard>
        </React.Fragment>
      )}
    </Container>
  );
};

const PreviewFeaturesModal = ({ onClose }: { onClose: () => void }) => {
  const { LoggedInUser } = useLoggedInUser();
  const previewFeatures = LoggedInUser?.getAvailablePreviewFeatures() || [];

  return (
    <StyledModal onClose={onClose} width="576px">
      <ModalHeader onClose={onClose}>
        <Flex width="100%" flexDirection="column">
          <Flex alignItems="center" mb={2} gridGap={2}>
            <FlaskConical color="#94a3b8" size={20} />

            <H2 fontSize={'20px'} fontWeight="700" lineHeight="36px" color="black.800">
              <FormattedMessage id="PreviewFeatures" defaultMessage="Preview Features" />
            </H2>
          </Flex>

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
          <StyledCard key={feature.key} mt={2}>
            <PreviewFeature feature={feature} />
          </StyledCard>
        ))}
      </ModalBody>
    </StyledModal>
  );
};

export default PreviewFeaturesModal;
