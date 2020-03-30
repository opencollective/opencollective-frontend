import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { Github } from '@styled-icons/fa-brands/Github';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { isURL, matches } from 'validator';

import Container from '../../components/Container';
import { H1, P } from '../../components/Text';
import StyledInputField from '../../components/StyledInputField';
import StyledInputGroup from '../../components/StyledInputGroup';
import StyledHr from '../../components/StyledHr';
import CollectivePickerAsync from '../../components/CollectivePickerAsync';
import OnboardingProfileCard from './OnboardingProfileCard';
import OnboardingSkipButton from './OnboardingSkipButton';

import withViewport, { VIEWPORTS } from '../../lib/withViewport';

class OnboardingContentBox extends React.Component {
  static propTypes = {
    step: PropTypes.number,
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    updateAdmins: PropTypes.func,
    addContact: PropTypes.func,
    intl: PropTypes.object.isRequired,
    viewport: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      admins: [],
      websiteError: null,
      githubError: null,
      twitterError: null,
    };

    this.messages = defineMessages({
      placeholder: {
        id: 'onboarding.contact.placeholder',
        defaultMessage: 'Write the name of who you want to invite',
      },
      twitterError: { id: 'onboarding.error.twitter', defaultMessage: 'Please enter a valid Twitter handle.' },
      githubError: { id: 'onboarding.error.github', defaultMessage: 'Please enter a valid Github handle.' },
      websiteError: { id: 'onboarding.error.website', defaultMessage: 'Please enter a valid URL.' },
    });
  }

  componentDidMount() {
    const member = this.props.LoggedInUser.memberOf.filter(member => member.collective.id === this.props.collective.id);
    this.setState({
      admins: [{ role: 'ADMIN', member: this.props.LoggedInUser.collective, id: member[0].id }],
    });
  }

  removeAdmin = collective => {
    const filteredAdmins = this.state.admins.filter(admin => admin.member.id !== collective.id);
    this.setState(
      {
        admins: filteredAdmins,
      },
      () => this.props.updateAdmins(this.state.admins),
    );
  };

  validateField = (fieldName, fieldValue) => {
    // fields aren't required so don't validate empty
    if (fieldValue === '') {
      return;
    }
    if (fieldName === 'website') {
      isURL(fieldValue) === false
        ? this.setState({ websiteError: this.props.intl.formatMessage(this.messages['websiteError']) })
        : this.setState({ websiteError: null });
    } else if (fieldName === 'githubHandle') {
      // https://github.com/shinnn/github-username-regex
      matches(fieldValue, /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i) === false
        ? this.setState({ githubError: this.props.intl.formatMessage(this.messages['githubError']) })
        : this.setState({ githubError: null });
    } else if (fieldName === 'twitterHandle') {
      // https://stackoverflow.com/questions/11361044/twitter-name-validation
      matches(fieldValue, /^[a-zA-Z0-9_]{1,15}$/) === false
        ? this.setState({ twitterError: this.props.intl.formatMessage(this.messages['twitterError']) })
        : this.setState({ twitterError: null });
    }
  };

  render() {
    const { step, collective, updateAdmins, addContact, intl, LoggedInUser, viewport } = this.props;
    const { admins, websiteError, twitterError, githubError } = this.state;

    return (
      <Container display="flex" flexDirection="column" width={['90%', '80%']} alignItems="center">
        {step === 0 && (
          <Flex flexDirection="column" alignItems="center" maxWidth={['336px']}>
            <H1
              fontSize={['H5']}
              lineHeight={['H5']}
              fontWeight="bold"
              color="black.900"
              textAlign="center"
              mb={[4]}
              mx={[2, null]}
            >
              <FormattedMessage
                id="onboarding.collective.created"
                defaultMessage="The {collective} Collective has been created!"
                values={{ collective: collective.name }}
              />
              &nbsp;🎉
            </H1>
            {viewport === VIEWPORTS.MOBILE && (
              <Fragment>
                <OnboardingSkipButton />
              </Fragment>
            )}
          </Flex>
        )}
        {step === 1 && (
          <Fragment>
            <Flex maxWidth={['336px']}>
              <H1 fontSize={['H5']} lineHeight={['H5']} fontWeight="bold" color="black.900" textAlign="center" mb={4}>
                <FormattedMessage id="onboarding.admins.header" defaultMessage="Add administrators" />
              </H1>
            </Flex>
            <Flex px={3} width="100%">
              <P my={2} fontSize="Caption" textTransform="uppercase" color="black.700">
                <FormattedMessage id="administrators" defaultMessage="Administrators" />
              </P>
              <Flex flexGrow={1} alignItems="center">
                <StyledHr width="100%" ml={2} />
              </Flex>
            </Flex>
            {admins.length > 0 && (
              <Flex px={3} width="100%" flexWrap="wrap">
                {admins.map(admin => (
                  <OnboardingProfileCard
                    key={admin.member.id}
                    collective={admin.member}
                    adminCollective={LoggedInUser.collective}
                    removeAdmin={this.removeAdmin}
                  />
                ))}
              </Flex>
            )}
            <Flex px={3} width="100%">
              <P my={2} fontSize="Caption" textTransform="uppercase" color="black.700">
                <FormattedMessage id="onboarding.admins.invite" defaultMessage="Invite administrators" />
              </P>
              <Flex flexGrow={1} alignItems="center">
                <StyledHr width="100%" ml={2} />
              </Flex>
            </Flex>

            <Flex my={2} px={3} flexDirection="column" width="100%">
              <CollectivePickerAsync
                creatable
                collective={null}
                preload={true}
                types={['USER']}
                onChange={option => {
                  // only assign admins if they are not in the list already
                  const duplicates = admins.filter(admin => admin.member.id === option.value.id);
                  this.setState(
                    state => ({
                      admins: duplicates.length ? admins : [...state.admins, { role: 'ADMIN', member: option.value }],
                    }),
                    () => updateAdmins(this.state.admins),
                  );
                }}
                placeholder={intl.formatMessage(this.messages['placeholder'])}
              />
            </Flex>
            <P my={2} fontSize="Caption" color="black.500" textAlign="center">
              <FormattedMessage
                id="onboarding.admins.caption"
                defaultMessage="Admins can modify the Collective page and approve expenses."
              />
            </P>
          </Fragment>
        )}
        {step === 2 && (
          <Fragment>
            <Box maxWidth={['336px']}>
              <H1 fontSize={['H5']} lineHeight={['H5']} fontWeight="bold" color="black.900" textAlign="center" mb={4}>
                <FormattedMessage id="onboarding.contact.header" defaultMessage="Links and contact info" />
              </H1>
            </Box>
            <Flex flexDirection="column" width="100%">
              <P>
                <FormattedMessage id="onboarding.contact.website" defaultMessage="Do you have a website?" />
              </P>
              <StyledInputField my={[3, 2]} htmlFor="website" error={websiteError}>
                {inputProps => (
                  <StyledInputGroup
                    type="text"
                    onBlur={({ target }) => {
                      addContact(target.name, target.value);
                      this.validateField(target.name, target.value);
                    }}
                    prepend="http://"
                    placeholder="www.agora.com"
                    {...inputProps}
                  />
                )}
              </StyledInputField>
              <P>
                <FormattedMessage id="onboarding.contact.connect" defaultMessage="Connect your social platforms" />
              </P>
              <P my={2} fontSize="Caption" color="black.500">
                <FormattedMessage
                  id="onboarding.contact.social"
                  defaultMessage="Tell your contributors how to reach your Collective through social media."
                />
              </P>
              <Flex alignItems="center">
                <Twitter size={20} color="black.500" />
                <StyledInputField ml={2} my={2} htmlFor="twitterHandle" flexGrow={1} error={twitterError}>
                  {inputProps => (
                    <StyledInputGroup
                      type="text"
                      onBlur={({ target }) => {
                        addContact(target.name, target.value);
                        this.validateField(target.name, target.value);
                      }}
                      placeholder="agora"
                      prepend="@"
                      {...inputProps}
                    />
                  )}
                </StyledInputField>
              </Flex>
              <Flex alignItems="center">
                <Github size={20} color="black.500" />
                <StyledInputField ml={2} my={2} htmlFor="githubHandle" flexGrow={1} error={githubError}>
                  {inputProps => (
                    <StyledInputGroup
                      type="text"
                      onBlur={({ target }) => {
                        addContact(target.name, target.value);
                        this.validateField(target.name, target.value);
                      }}
                      placeholder="agoraos"
                      prepend="github.com/"
                      {...inputProps}
                    />
                  )}
                </StyledInputField>
              </Flex>
            </Flex>
          </Fragment>
        )}
      </Container>
    );
  }
}

export default withViewport(injectIntl(OnboardingContentBox));
