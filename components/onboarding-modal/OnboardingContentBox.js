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
    LoggedInUser: PropTypes.object,
    addAdmins: PropTypes.func,
    addContact: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      admins: [],
    };
  }

  componentDidMount() {
    const member = this.props.LoggedInUser.memberOf.filter(member => member.collective.id === this.props.collective.id);
    this.setState({
      admins: [{ role: 'ADMIN', member: this.props.LoggedInUser.collective, id: member[0].id }],
    });
  }

  render() {
    const { step, collective, LoggedInUser, addAdmins, addContact } = this.props;
    const { admins } = this.state;

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
                  <OnboardingProfileCard key={i} user={admin.member} adminUser={LoggedInUser.collective} />
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
                creatable
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
                    onBlur={({ target }) => addContact(target.name, target.value)}
                    placeholder="agora.com"
                    {...inputProps}
                  />
                )}
              </StyledInputField>
              <StyledInputField my={2} label="Connect your social platforms" htmlFor="twitterHandle">
                {inputProps => (
                  <StyledInputGroup
                    type="text"
                    onBlur={({ target }) => addContact(target.name, target.value)}
                    placeholder="agora"
                    prepend="@"
                    {...inputProps}
                  />
                )}
              </StyledInputField>
              <StyledInputField my={2} htmlFor="githubHandle">
                {inputProps => (
                  <StyledInputGroup
                    type="text"
                    onBlur={({ target }) => addContact(target.name, target.value)}
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
