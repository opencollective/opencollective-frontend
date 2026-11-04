import React, { Fragment } from 'react';
import type { IntlShape } from 'react-intl';
import { FormattedMessage } from 'react-intl';

import type { SocialLink } from '../../lib/graphql/types/v2/graphql';
import injectIntl from '@/lib/injectIntl';

import CollectivePickerAsync from '../../components/CollectivePickerAsync';
import Container from '../../components/Container';
import StyledHr from '../../components/StyledHr';

import SocialLinksFormField from '../edit-collective/SocialLinksFormField';
import { Box, Flex } from '../Grid';
import { H1, P } from '../Text';

import OnboardingProfileCard from './OnboardingProfileCard';
import OnboardingSkipButton from './OnboardingSkipButton';

type OnboardingAdmin = {
  id?: number;
  role: string;
  member: { id: number; name?: string; imageUrl?: string; slug?: string };
};

type OnboardingContentBoxProps = {
  slug?: string;
  step: number;
  collective: { id: number; name?: string };
  memberInvitations?: Array<{
    role?: string;
    memberAccount: { id: number; name?: string; imageUrl?: string; slug?: string };
  }>;
  LoggedInUser: {
    collective: OnboardingAdmin['member'];
    memberOf: Array<{ id: number; role?: string; collective: { id: number } }>;
  };
  updateAdmins?: (admins: OnboardingAdmin[]) => void;
  /** @ignore from injectIntl */
  intl?: IntlShape;
  values?: { socialLinks?: SocialLink[] };
  errors?: { socialLinks?: string };
  touched?: { socialLinks?: boolean };
  setFieldValue?: (field: string, value: unknown) => void;
  setFieldTouched?: (field: string, isTouched?: boolean) => void;
};

type OnboardingContentBoxState = {
  admins: OnboardingAdmin[];
};

class OnboardingContentBox extends React.Component<OnboardingContentBoxProps, OnboardingContentBoxState> {
  constructor(props: OnboardingContentBoxProps) {
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

  removeAdmin = (collective: { id: number }) => {
    const filteredAdmins = this.state.admins.filter(admin => admin.member.id !== collective.id);
    this.setState(
      {
        admins: filteredAdmins,
      },
      () => this.props.updateAdmins(this.state.admins),
    );
  };

  render() {
    const { slug, step, collective, updateAdmins, intl, values, touched } = this.props;
    const { admins } = this.state;

    return (
      <Container
        {...({ width: ['90%', '80%'] } as React.ComponentProps<typeof Container>)}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
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
                defaultMessage="{collective} has been created!"
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
            <Flex px={3} width="100%" flexWrap="wrap" data-cy="profile-card">
              <OnboardingProfileCard
                key={this.props.LoggedInUser.collective.id}
                collective={this.props.LoggedInUser.collective}
              />
              {this.props.memberInvitations.map(admin => (
                <OnboardingProfileCard key={admin.memberAccount.id} collective={admin.memberAccount} isPending />
              ))}
              {admins
                .filter(admin => admin.member.id !== this.props.LoggedInUser.collective.id)
                .map(admin => (
                  <OnboardingProfileCard
                    key={admin.member.id}
                    collective={admin.member}
                    removeAdmin={this.removeAdmin}
                  />
                ))}
            </Flex>
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
                inputId="onboarding-admin-picker"
                creatable
                collective={null}
                types={['USER']}
                data-cy="admin-picker"
                menuPortalTarget={null}
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
                placeholder={intl.formatMessage({
                  id: 'onboarding.contact.placeholder',
                  defaultMessage: 'Who do you want to invite?',
                })}
              />
            </Flex>
            <P my={2} fontSize="12px" color="black.500" textAlign="center">
              <FormattedMessage
                id="onboarding.admins.caption"
                defaultMessage="Admins can modify settings and approve expenses."
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
            <SocialLinksFormField
              value={values.socialLinks}
              touched={touched.socialLinks}
              onChange={s => {
                this.props.setFieldValue('socialLinks', s);
                this.props.setFieldTouched('socialLinks');
              }}
            />
          </Fragment>
        )}
      </Container>
    );
  }
}

export default injectIntl(OnboardingContentBox);
