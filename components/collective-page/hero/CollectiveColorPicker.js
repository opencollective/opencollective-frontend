import React from 'react';
import { Mutation } from '@apollo/client/react/components';
import { Check } from '@styled-icons/fa-solid/Check';
import { cloneDeep, set } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled, { withTheme } from 'styled-components';
import { isHexColor } from 'validator';

import { API_V1_CONTEXT } from '@/lib/graphql/helpers';
import { editCollectiveSettingsMutation } from '@/lib/graphql/v1/mutations';
import defaultTheme from '@/lib/theme';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import StyledCard from '../../StyledCard';
import StyledInput from '../../StyledInput';
import StyledInputGroup from '../../StyledInputGroup';
import { P } from '../../Text';
import { Button } from '../../ui/Button';

const colorPath = 'collectivePage.primaryColor';

const ColorPreset = styled.button`
  cursor: pointer;
  width: 30px;
  height: 30px;
  margin-right: 5px;
  margin-bottom: 8px;
  border-radius: 50%;
  border: none;
  transition: transform 0.1s;
  &:hover {
    transform: scale(1.25);
  }
`;

// prettier-ignore
const PRESET_COLORS = [
  '#BE2721', '#F65316', '#D17C07', '#1E824C', '#1D8882', '#1F3993', '#663299', '#2E3131',
  '#E94531', '#ED7529', '#F89308', '#19B156', '#12ADA4', '#3062BC', '#9E28B4', '#6D7A89',
  '#FA533E', '#F6A050', '#FFA413', '#1AC780', '#55C9BC', '#3E8DCE', '#B13BC6', '#95A5A6',
];

/** Ensure the color is formatted like #123456 */
const validateColor = value => isHexColor(value) && value.length === 7;

const CollectiveColorPicker = ({ collective, onChange, onClose, theme }) => {
  const color = theme.colors.primary.base || theme.colors.primary[500];
  const [textValue, setTextValue] = React.useState(color.replace('#', ''));
  const [showError, setShowError] = React.useState(false);
  const hasError = !validateColor(`#${textValue}`);
  const dispatchValue = v => {
    setTextValue(v.replace('#', ''));
    onChange(v);
  };

  return (
    <Mutation mutation={editCollectiveSettingsMutation} context={API_V1_CONTEXT}>
      {(editSettings, { loading }) => (
        <StyledCard
          data-cy="collective-color-picker-card"
          flexDirection="column"
          boxShadow="4px 4px 10px #c7c5c5"
          maxWidth={360}
        >
          <Box px={32} py={24}>
            <P fontSize="20px" fontWeight={600} mb={3}>
              <FormattedMessage id="CollectiveColorPicker.Title" defaultMessage="Select page color" />
            </P>
            <P fontSize="16px" mb={3}>
              <FormattedMessage id="CollectiveColorPicker.Preset" defaultMessage="Preset colors" />
            </P>
            <Flex flexWrap="wrap" justifyContent="space-between">
              {PRESET_COLORS.map(preset => (
                <ColorPreset
                  data-cy="collective-color-picker-options-btn"
                  key={preset}
                  style={{ background: preset }}
                  onClick={() => dispatchValue(preset)}
                >
                  {color === preset && <Check size={12} color="white" />}
                </ColorPreset>
              ))}
            </Flex>
            <P fontSize="16px" mt={3} mb={2}>
              <FormattedMessage id="CollectiveColorPicker.Custom" defaultMessage="Use custom color" />
            </P>
            <Flex>
              <StyledInput
                size={40}
                flex="0 0 40px"
                px={2}
                py={2}
                background="white"
                borderRadius="50%"
                type="color"
                value={color}
                disabled={loading}
                onChange={e => {
                  dispatchValue(e.target.value);
                }}
              />
              <div>
                <StyledInputGroup
                  prepend="#"
                  placeholder="000000"
                  px={2}
                  containerProps={{ ml: 2 }}
                  value={textValue}
                  maxLength={7}
                  disabled={loading}
                  onBlur={() => setShowError(true)}
                  error={
                    showError &&
                    hasError && (
                      <FormattedMessage
                        id="CollectiveColorPicker.Error"
                        defaultMessage="Please use an hexadecimal value (eg. #3E8DCE)"
                      />
                    )
                  }
                  onChange={e => {
                    const newValue = e.target.value.replace('#', '');
                    setTextValue(newValue);
                    setShowError(false); // Don't show errors while typing
                    const hexValue = `#${newValue}`;
                    if (validateColor(hexValue)) {
                      onChange(hexValue);
                    }
                  }}
                />
              </div>
            </Flex>
          </Box>
          <Container borderTop="1px solid #D7DBE0" px={2}>
            <Flex justifyContent="space-between" flexWrap="wrap" gap="8px" p="8px">
              <Button
                className="flex-1 capitalize"
                size="sm"
                variant="outline"
                onClick={() => {
                  dispatchValue(defaultTheme.colors.primary[500]);
                }}
              >
                <FormattedMessage id="Reset" defaultMessage="Reset" />
              </Button>
              <Flex flex="1 1 50%" justifyContent="flex-end" gap="8px">
                <Button
                  className="flex-1 capitalize"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onChange(null);
                    onClose();
                  }}
                >
                  <FormattedMessage id="form.cancel" defaultMessage="cancel" />
                </Button>
                <Button
                  data-cy="collective-color-picker-save-btn"
                  className="flex-1 capitalize"
                  size="sm"
                  variant="default"
                  loading={loading}
                  disabled={hasError}
                  onClick={() => {
                    const newSettings = cloneDeep(collective.settings || {});
                    set(newSettings, colorPath, color);
                    editSettings({
                      variables: { id: collective.id, settings: newSettings },
                    }).then(() => {
                      onChange(null);
                      onClose();
                    });
                  }}
                >
                  <FormattedMessage id="save" defaultMessage="Save" />
                </Button>
              </Flex>
            </Flex>
          </Container>
        </StyledCard>
      )}
    </Mutation>
  );
};

export default withTheme(CollectiveColorPicker);
