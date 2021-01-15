import React from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { useFormik } from 'formik';
import { cloneDeep, get, pick, set } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { getErrorFromGraphqlException } from '../../../lib/errors';

import Container from '../../Container';
import HostPayouts2FARollingLimitFAQ from '../../faqs/HostPayouts2FARollingLimitFAQ';
import { Flex } from '../../Grid';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledCheckbox from '../../StyledCheckbox';
import StyledInputAmount from '../../StyledInputAmount';
import StyledInputField from '../../StyledInputField';
import { P } from '../../Text';
import { editCollectiveSettingsMutation } from '../mutations';
import SettingsTitle from '../SettingsTitle';

import imgPreviewModal from '../../../public/static/images/host-two-factor-authentication/host-two-factor-authentication-payout-modal.png';
import imgPreviewPrompt from '../../../public/static/images/host-two-factor-authentication/host-two-factor-authentication-payout-modal-prompt.png';

const messages = defineMessages({
  'rollingLimit.label': {
    id: 'editCollective.rollingLimit.label',
    defaultMessage: 'Rolling payout limit',
  },
  'rollingLimit.placeholder': {
    id: 'collective.contributionPolicy.placeholder',
    defaultMessage:
      'For example: what type of contributors (like casinos) you do not want donations from, or under what circumstances you might allow certain donations, etc.',
  },
  'rollingLimit.enable': {
    id: 'editCollective.rollingLimit.enable',
    defaultMessage: 'Enable 2FA for payouts',
  },
});

const ScreenshotPreview = styled.div`
  display: block;
  margin: 8px;
  padding: 8px;
  height: 240px;
  border: 1px solid #ececec;
  border-radius: 16px;

  img {
    max-height: 100%;
  }
`;

const HostTwoFactorAuth = ({ collective }) => {
  const { formatMessage } = useIntl();
  const [setSettings, { loading, error }] = useMutation(editCollectiveSettingsMutation);
  const doesHostAlreadyHaveTwoFactorAuthEnabled = get(collective, 'settings.payoutsTwoFactorAuth.enabled', false);
  const hostRollingLimitAmount = get(collective, 'settings.payoutsTwoFactorAuth.rollingLimit', 1000000);
  const defaultIsChecked = doesHostAlreadyHaveTwoFactorAuthEnabled;

  // Form
  const formik = useFormik({
    initialValues: {
      rollingLimit: hostRollingLimitAmount,
    },
    async onSubmit(values) {
      const { rollingLimit } = values;
      const updatedCollective = cloneDeep(collective);
      set(updatedCollective, 'settings.payoutsTwoFactorAuth.rollingLimit', rollingLimit);
      await setSettings({ variables: pick(updatedCollective, ['id', 'settings']) });
    },
  });

  return (
    <Flex flexDirection="column">
      <Container>
        <SettingsTitle>
          <FormattedMessage id="TwoFactorAuth.Setup.Title" defaultMessage="Set up two-factor authentication" />
        </SettingsTitle>
        <Flex mb={2} flexWrap="wrap" justifyContent="center">
          <Container mr={3} pr={3} flex="1 1" minWidth={300} maxWidth={700} borderRight={[null, '1px solid #dcdee0']}>
            <P wordBreak="break-word">
              <FormattedMessage
                id="TwoFactorAuth.Setup.FiscalHost.Info"
                defaultMessage="Two-factor authentication (2FA) adds an extra layer of security for your account when logging in. For fiscal hosts, you can turn on 2FA to be used with high-risk activities like paying expenses. Enabling 2FA for the fiscal host means that every host admin (including yourself) will be required to enable 2FA for logging into their account."
              />
            </P>
          </Container>
          <Flex flexDirection="column" alignItems="center" justifyContent="center" minWidth={300}>
            {doesHostAlreadyHaveTwoFactorAuthEnabled ? (
              <Container>
                <form onSubmit={formik.handleSubmit}>
                  <Flex>
                    <StyledInputField
                      name="rollingLimit"
                      htmlFor="rollingLimit"
                      disabled={loading}
                      label={formatMessage(messages['rollingLimit.label'])}
                      labelProps={{ mb: 2, pt: 2, lineHeight: '18px', fontWeight: 'bold' }}
                    >
                      {inputProps => (
                        <StyledInputAmount
                          {...inputProps}
                          currency={collective.currency}
                          type="number"
                          fontSize="14px"
                          value={formik.values.rollingLimit}
                          placeholder={formatMessage(messages['rollingLimit.placeholder'])}
                          onChange={value => formik.setFieldValue('rollingLimit', value)}
                          min={100}
                          precision={2}
                          px="2px"
                        />
                      )}
                    </StyledInputField>
                    <Flex alignItems="flex-end">
                      <StyledButton
                        maxHeight="45px"
                        buttonStyle="primary"
                        mx={2}
                        buttonSize="small"
                        type="submit"
                        onSubmit={formik.handleSubmit}
                      >
                        <FormattedMessage id="save" defaultMessage="Save" />
                      </StyledButton>
                    </Flex>
                  </Flex>
                </form>
              </Container>
            ) : (
              <StyledCheckbox
                name="enable-rolling-limit"
                label={formatMessage(messages['rollingLimit.enable'])}
                defaultChecked={defaultIsChecked}
                width="auto"
                isLoading={loading}
                onChange={({ target }) => {
                  const updatedCollective = cloneDeep(collective);
                  set(updatedCollective, 'settings.payoutsTwoFactorAuth.enabled', target.value);
                  return setSettings({ variables: pick(updatedCollective, ['id', 'settings']) });
                }}
              />
            )}
          </Flex>
        </Flex>
        {error && (
          <MessageBox type="error" fontSize="14px" withIcon mb={3}>
            {getErrorFromGraphqlException(error).message}
          </MessageBox>
        )}
        <Flex flexWrap="wrap" justifyContent="space-between" width="100%">
          <ScreenshotPreview>
            <img src={imgPreviewModal} alt="Preview host payouts rolling limit" />
          </ScreenshotPreview>
          <ScreenshotPreview>
            <img src={imgPreviewPrompt} alt="Preview host payouts rolling limit" />
          </ScreenshotPreview>
          <hr />
        </Flex>
        <hr />
        <HostPayouts2FARollingLimitFAQ defaultOpen currency={collective.currency} />
      </Container>
    </Flex>
  );
};

HostTwoFactorAuth.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number.isRequired,
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    settings: PropTypes.string.isRequired,
  }),
};

export default HostTwoFactorAuth;
