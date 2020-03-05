import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';

import Container from '../../components/Container';
import { H1, P } from '../../components/Text';
import StyledInput from '../../components/StyledInput';
import StyledInputField from '../../components/StyledInputField';
import StyledInputGroup from '../../components/StyledInputGroup';
import StyledHr from '../../components/StyledHr';
import CollectivePickerAsync from '../../components/CollectivePickerAsync';
import OnboardingProfileCard from './OnboardingProfileCard';

class OnboardingContentBox extends React.Component {
  static propTypes = {
    step: PropTypes.number,
    collective: PropTypes.object,
    adminUser: PropTypes.object,
    addAdmins: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      admins: [{ role: 'ADMIN', member: this.props.adminUser }],
    };
  }

  handleValue = (name, value, values) => {
    values[name] = value;
    return values;
  };

  render() {
    const { step, collective, adminUser, addAdmins } = this.props;
    const { admins } = this.state;

    const values = {
      website: '',
      github: '',
      twitter: '',
    };

    return (
      <Container minWidth={[500]}>
        {step === 0 && (
          <Fragment>
            <H1
              fontSize={['H5', 'H3']}
              lineHeight={['H5', 'H3']}
              fontWeight="bold"
              color="black.900"
              textAlign="center"
              mb={4}
            >
              The {collective.name} Collective has been created!
            </H1>
            <P fontSize={['H5', 'H3']} lineHeight={['H5', 'H3']} textAlign="center">
              🎉
            </P>
          </Fragment>
        )}
        {step === 1 && (
          <Fragment>
            <H1
              fontSize={['H5', 'H3']}
              lineHeight={['H5', 'H3']}
              fontWeight="bold"
              color="black.900"
              textAlign="center"
              mb={4}
            >
              Add administrators
            </H1>
            <Flex px={3}>
              <P my={2} fontSize="Caption" textTransform="uppercase" color="black.700">
                Administrators
              </P>
              <Flex flexGrow={1} alignItems="center">
                <StyledHr width="100%" ml={2} />
              </Flex>
            </Flex>
            {admins.length > 0 && (
              <Flex flexDirection="column">
                {admins.map((admin, i) => (
                  <OnboardingProfileCard key={i} user={admin.member} adminUser={adminUser} />
                ))}
              </Flex>
            )}
            <Flex px={3}>
              <P my={2} fontSize="Caption" textTransform="uppercase" color="black.700">
                Invite administrators
              </P>
              <Flex flexGrow={1} alignItems="center">
                <StyledHr width="100%" ml={2} />
              </Flex>
            </Flex>

            <Flex my={2} px={3} flexDirection="column">
              <CollectivePickerAsync
                types={['USER']}
                onChange={option => {
                  // only assign admins if they are not in the list already
                  const duplicates = admins.filter(admin => admin.id === option.value.id);
                  this.setState(
                    state => ({
                      admins: duplicates.length ? admins : [...state.admins, { role: 'ADMIN', member: option.value }],
                    }),
                    () => addAdmins(this.state.admins),
                  );
                }}
                placeholder="Write the name of who you want to invite"
              />
            </Flex>
            <P my={2} fontSize="Caption" color="black.500" textAlign="center">
              Admins can modify the Collective page and approve expenses.
            </P>
          </Fragment>
        )}
        {step === 2 && (
          <Fragment>
            <H1
              fontSize={['H5', 'H3']}
              lineHeight={['H5', 'H3']}
              fontWeight="bold"
              color="black.900"
              textAlign="center"
              mb={4}
            >
              Links and contact info
            </H1>

            <Flex flexDirection="column">
              <StyledInputField my={2} label="Do you have a website?" htmlFor="website">
                {inputProps => (
                  <StyledInput
                    type="text"
                    onBlur={({ target }) => this.handleValue(target.name, target.value, values)}
                    placeholder="agora.com"
                    {...inputProps}
                  />
                )}
              </StyledInputField>
              <StyledInputField my={2} label="Connect your social platforms" htmlFor="twitter">
                {inputProps => (
                  <StyledInputGroup
                    type="text"
                    onBlur={({ target }) => this.handleValue(target.name, target.value, values)}
                    placeholder="agora"
                    prepend="@"
                    {...inputProps}
                  />
                )}
              </StyledInputField>
              <StyledInputField my={2} htmlFor="github">
                {inputProps => (
                  <StyledInputGroup
                    type="text"
                    onBlur={({ target }) => this.handleValue(target.name, target.value, values)}
                    placeholder="agoraos"
                    prepend="github.com/"
                    {...inputProps}
                  />
                )}
              </StyledInputField>
            </Flex>
          </Fragment>
        )}
      </Container>
    );
  }
}

export default OnboardingContentBox;
