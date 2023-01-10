import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import { Box, Flex } from '../Grid';
import Image from '../Image';
import StyledCard from '../StyledCard';
import { P } from '../Text';

const ProjectTypeOptionContainer = styled.label`
  display: flex;
  align-items: baseline;
  padding: 15px 16px;
  margin-bottom: 0;
  cursor: pointer;
  background: white;
  justify-content: flex-start;
  flex: 1;

  // The following adds a border on top and left to separate items. Because parent has overflow=hidden,
  // only the required one will actually be displayed
  border-top: 1px solid #dcdee0;
  border-left: 1px solid #dcdee0;
  margin-top: -1px;
  margin-left: -1px;

  input[type='radio'] {
    margin-right: 4px;
  }
`;

const ProjectTypeOption = ({ name, value, label, description, isChecked, onChange, iconSrc }) => {
  return (
    <ProjectTypeOptionContainer>
      <Box mr={2} alignSelf={'center'}>
        <input type="radio" name={name} value={value} checked={isChecked} onChange={onChange} />
      </Box>
      <Box mr={3} flexShrink="0" alignSelf="center">
        <Image src={iconSrc} width={48} height={48} />
      </Box>
      <Box>
        <P fontSize="16px" fontWeight="bold" mb={2}>
          {label}
        </P>
        <P fontSize="12px" color="black.600" fontWeight="normal">
          {description}
        </P>
      </Box>
    </ProjectTypeOptionContainer>
  );
};

ProjectTypeOption.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  value: PropTypes.oneOf(['CODE', 'COMMUNITY']).isRequired,
  isChecked: PropTypes.bool,
  onChange: PropTypes.func,
  iconSrc: PropTypes.string.isRequired,
};

const Fieldset = styled.fieldset`
  border: none;
  padding: 0;
  margin: 0;
`;

const msg = defineMessages({
  code: {
    id: 'HostApplication.ProjectTypeSelect.code',
    defaultMessage: 'Code',
  },
  codeDescription: {
    id: 'HostApplication.ProjectTypeSelect.codeDescription',
    defaultMessage: 'My project is primarily concerned with the development and maintenance of a specific codebase.',
  },
  community: {
    id: 'community',
    defaultMessage: 'Community',
  },
  communityDescription: {
    id: 'HostApplication.ProjectTypeSelect.communityDescription',
    defaultMessage: 'My project is not strongly associated with a specific codebase.',
  },
});

const ProjectTypeSelect = ({ name, value, onChange, error }) => {
  const intl = useIntl();
  return (
    <React.Fragment>
      <StyledCard>
        <Fieldset onChange={onChange}>
          <Flex flexDirection={['column', 'row']} overflow="hidden">
            <ProjectTypeOption
              name={name}
              value="CODE"
              label={intl.formatMessage(msg.code)}
              description={intl.formatMessage(msg.codeDescription)}
              isChecked={value === 'CODE'}
              onChange={onChange}
              iconSrc="/static/images/night-sky.png"
            />
            <ProjectTypeOption
              name={name}
              value="COMMUNITY"
              label={intl.formatMessage(msg.community)}
              description={intl.formatMessage(msg.communityDescription)}
              isChecked={value === 'COMMUNITY'}
              onChange={onChange}
              iconSrc="/static/images/community.png"
            />
          </Flex>
        </Fieldset>
      </StyledCard>
      {error}
    </React.Fragment>
  );
};

ProjectTypeSelect.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOf(['CODE', 'COMMUNITY']),
  onChange: PropTypes.func,
  error: PropTypes.node,
};

export default React.memo(ProjectTypeSelect);
