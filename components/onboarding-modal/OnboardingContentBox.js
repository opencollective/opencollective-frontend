import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Github } from '@styled-icons/fa-brands/Github';
import { Twitter } from '@styled-icons/fa-brands/Twitter';
import { Field } from 'formik';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import CollectivePickerAsync from '../../components/CollectivePickerAsync';
import Container from '../../components/Container';
import StyledHr from '../../components/StyledHr';
import StyledInputField from '../../components/StyledInputField';
import StyledInputGroup from '../../components/StyledInputGroup';
import { H1, P } from '../../components/Text';

import { Box, Flex } from '../Grid';

import OnboardingProfileCard from './OnboardingProfileCard';
import OnboardingSkipButton from './OnboardingSkipButton';

class OnboardingContentBox extends React.Component {
  static propTypes = {
    slug: PropTypes.string,
    step: PropTypes.number,
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    updateAdmins: PropTypes.func,
    addContact: PropTypes.func,
    intl: PropTypes.object.isRequired,
    values: PropTypes.object,
    errors: PropTypes.object,
    touched: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      admins: [],
    };

    this.messages = defineMessages({
      placeholder: {
        id: 'onboarding.contact.placeholder',
        defaultMessage: 'Write the name of who you want to invite',
      },
    });
  }

  componentDidMount() {
    const member = this.props.LoggedInUser.memberOf.find(member => member.collective.id === this.props.collective.id);
    this.setState({
      admins: [{ role: 'ADMIN', member: this.props.LoggedInUser.collective, id: member.id }],
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

  render() {
    const { slug, step, collective, updateAdmins, intl, LoggedInUser, values, errors, touched } = this.props;
    const { admins } = this.state;

    return (
      <Container display="flex" flexDirection="column" width={['90%', '80%']} alignItems="center">
        {step === 0 && (
          <Flex flexDirection="column" alignItems="center" maxWidth="336px">
            <H1
              fontSize="20px"
              lineHeight="24px"
              fontWeight="bold"
              color="black.900"
              textAlign="center"
              mb={4}
              mx={2}
              data-cy="onboarding-collective-created"
            >
              <FormattedMessage
                id="onboarding.collective.created"
                defaultMessage="The {collective} Collective has been created!"
                values={{ collective: collective.name }}
              />
              &nbsp;🎉
            </H1>
            <Box display={['block', null, 'none']}>
              <OnboardingSkipButton slug={slug} />
            </Box>
          </Flex>
        )}
        {step === 1 && (
          <Fragment>
            <Flex maxWidth={336}>
              <H1 fontSize="20px" lineHeight="24px" fontWeight="bold" color="black.900" textAlign="center" mb={4}>
                <FormattedMessage id="onboarding.admins.header" defaultMessage="Add administrators" />
              </H1>
            </Flex>
            <Flex px={3} width="100%">
              <P my={2} fontSize="12px" textTransform="uppercase" color="black.700">
                <FormattedMessage id="administrators" defaultMessage="Administrators" />
              </P>
              <Flex flexGrow={1} alignItems="center">
                <StyledHr width="100%" ml={2} />
              </Flex>
            </Flex>
            {admins.length > 0 && (
              <Flex px={3} width="100%" flexWrap="wrap" data-cy="profile-card">
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
              <P my={2} fontSize="12px" textTransform="uppercase" color="black.700">
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
                types={['USER']}
                data-cy="admin-picker"
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
            <P my={2} fontSize="12px" color="black.500" textAlign="center">
              <FormattedMessage
                id="onboarding.admins.caption"
                defaultMessage="Admins can modify the Collective page and approve expenses."
              />
            </P>
          </Fragment>
        )}
        {step === 2 && (
          <Fragment>
            <Box maxWidth="336px">
              <H1 fontSize="20px" lineHeight="24px" fontWeight="bold" color="black.900" textAlign="center" mb={4}>
                <FormattedMessage id="onboarding.contact.header" defaultMessage="Links and contact info" />
              </H1>
            </Box>
            <Flex flexDirection="column" width="100%">
              <P>
                <FormattedMessage id="onboarding.contact.website" defaultMessage="Do you have a website?" />
              </P>
              <StyledInputField
                my={[3, 2]}
                htmlFor="website"
                name="website"
                value={values.website}
                error={touched.website && errors.website}
              >
                {inputProps => (
                  <Field
                    as={StyledInputGroup}
                    type="text"
                    prepend="http://"
                    placeholder="www.agora.com"
                    {...inputProps}
                  />
                )}
              </StyledInputField>
              <P>
                <FormattedMessage id="onboarding.contact.connect" defaultMessage="Connect your social platforms" />
              </P>
              <P my={2} fontSize="12px" color="black.500">
                <FormattedMessage
                  id="onboarding.contact.social"
                  defaultMessage="Tell your contributors how to reach your Collective through social media."
                />
              </P>
              <Flex alignItems="center">
                <Twitter size={20} color="black.500" />
                <StyledInputField
                  ml={2}
                  my={2}
                  htmlFor="twitterHandle"
                  name="twitterHandle"
                  flexGrow={1}
                  value={values.twitterHandle}
                  error={touched.twitterHandle && errors.twitterHandle}
                >
                  {inputProps => (
                    <Field as={StyledInputGroup} type="text" placeholder="agora" prepend="@" {...inputProps} />
                  )}
                </StyledInputField>
              </Flex>
              <Flex alignItems="center">
                <Github size={20} color="black.500" />
                <StyledInputField
                  ml={2}
                  my={2}
                  htmlFor="githubHandle"
                  name="githubHandle"
                  flexGrow={1}
                  value={values.githubHandle}
                  error={touched.githubHandle && errors.githubHandle}
                >
                  {inputProps => (
                    <Field
                      as={StyledInputGroup}
                      type="text"
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

export default injectIntl(OnboardingContentBox);
