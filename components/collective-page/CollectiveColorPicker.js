import React from 'react';
import PropTypes from 'prop-types';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { Flex } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';
import { get, set } from 'lodash';

import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledCard from '../StyledCard';

const EditCollectiveSettings = gql`
  mutation EditCollective($id: Int!, $settings: JSON) {
    editCollective(collective: { id: $id, settings: $settings }) {
      id
      settings
    }
  }
`;

const colorPath = 'collectivePage.primaryColor';

const CollectiveColorPicker = ({ collective, onChange, onClose }) => {
  const [newColor, setValue] = React.useState(get(collective.settings, colorPath, '#000000'));
  return (
    <Mutation mutation={EditCollectiveSettings}>
      {(editSettings, { loading }) => (
        <StyledCard
          px={2}
          py={3}
          display="flex"
          flexDirection="column"
          alignItems="center"
          boxShadow="4px 4px 10px #c7c5c5"
        >
          <StyledInput
            mb={3}
            py="1px"
            px="5px"
            minHeight={40}
            minWidth={250}
            type="color"
            defaultValue={newColor}
            disabled={loading}
            onChange={e => {
              setValue(e.target.value);
              onChange(e.target.value);
            }}
          />
          <Flex>
            <StyledButton
              mx={2}
              minWidth={150}
              textTransform="capitalize"
              onClick={() => {
                onChange(null);
                onClose();
              }}
            >
              <FormattedMessage id="form.cancel" defaultMessage="cancel" />
            </StyledButton>
            <StyledButton
              mx={2}
              minWidth={150}
              buttonStyle="primary"
              textTransform="capitalize"
              loading={loading}
              onClick={() =>
                editSettings({
                  variables: {
                    id: collective.id,
                    settings: set(collective.settings, colorPath, newColor),
                  },
                }).then(() => {
                  onChange(null);
                  onClose();
                })
              }
            >
              <FormattedMessage id="save" defaultMessage="save" />
            </StyledButton>
          </Flex>
        </StyledCard>
      )}
    </Mutation>
  );
};

CollectiveColorPicker.propTypes = {
  collective: PropTypes.shape({
    id: PropTypes.number,
    settings: PropTypes.shape({
      collectivePage: PropTypes.shape({
        primaryColor: PropTypes.string,
      }),
    }),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CollectiveColorPicker;
