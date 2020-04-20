import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex } from '@rebass/grid';
import { defineMessages, injectIntl } from 'react-intl';
import styled from 'styled-components';
import { uniqBy } from 'lodash';
import { PlusCircle } from '@styled-icons/boxicons-regular/PlusCircle';

import acceptOrganizationIllustration from '../../public/static/images/create-collective/acceptContributionsOrganizationHoverIllustration.png';
import { H1, H2, P } from '../Text';
import Container from '../Container';
import CollectiveNavbar from '../CollectiveNavbar';
import Avatar from '../../components/Avatar';
import StyledHr from '../../components/StyledHr';
import CreateCollectiveMiniForm from '../../components/CreateCollectiveMiniForm';

import { withUser } from '../UserProvider';

const Image = styled.img`
  @media screen and (min-width: 52em) {
    height: 256px;
    width: 256px;
  }
  @media screen and (max-width: 40em) {
    height: 192px;
    width: 192px;
  }
  @media screen and (min-width: 40em) and (max-width: 52em) {
    height: 208px;
    width: 208px;
  }
`;

const CreateNewOrg = styled(Flex)`
  border: 1px solid lightgray;
  border-radius: 10px;
  padding: 20px;
  cursor: pointer;
`;

const OrgCard = styled(Flex)`
  cursor: pointer;
  border-radius: 10px;
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

class AcceptContributionsMyself extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    intl: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      loading: null,
      miniForm: false,
      organization: null,
    };

    this.messages = defineMessages({
      header: {
        id: 'acceptContributions.picker.header',
        defaultMessage: 'Accept financial contributions',
      },
      ourOrganization: {
        id: 'acceptContributions.organization.subtitle',
        defaultMessage: 'Our organization',
      },
    });
  }

  render() {
    const { intl, collective, LoggedInUser } = this.props;
    const { miniForm } = this.state;

    const memberships = uniqBy(
      LoggedInUser.memberOf.filter(m => m.role !== 'BACKER'),
      m => m.collective.id,
    );

    const orgs = memberships
      .filter(m => m.collective.type === 'ORGANIZATION')
      .sort((a, b) => {
        return a.collective.slug.localeCompare(b.collective.slug);
      });

    return (
      <Fragment>
        <CollectiveNavbar collective={collective} onlyInfos={true} />
        <Box mb={2} mt={5} mx={[2, 6]}>
          <H1 fontSize={['H5', 'H3']} lineHeight={['H5', 'H3']} fontWeight="bold" color="black.900" textAlign="center">
            {intl.formatMessage(this.messages.header)}
          </H1>
        </Box>
        <Container display="flex" flexDirection="column" alignItems="center">
          <Flex flexDirection="column" alignItems="center" maxWidth={'575px'} my={2} mx={[3, 0]}>
            <Image src={acceptOrganizationIllustration} alt="" />
            <H2 fontSize="H5" fontWeight="bold" color="black.900" textAlign="center">
              {intl.formatMessage(this.messages.ourOrganization)}
            </H2>
          </Flex>
          <Flex flexDirection="column" justifyContent="center" alignItems="center" my={3} minWidth={'450px'}>
            <Flex px={3} width="100%">
              <P my={2} fontSize="Caption" textTransform="uppercase" color="black.700">
                My organizations
              </P>
              <Flex flexGrow={1} alignItems="center">
                <StyledHr width="100%" ml={2} />
              </Flex>
            </Flex>
            {orgs.length > 0 && (
              <Flex px={3} width="100%" flexDirection="column">
                {orgs.map(org => (
                  <OrgCard
                    alignItems="center"
                    key={org.collective.id}
                    my={2}
                    onClick={() => this.setState({ organization: org.collective })}
                  >
                    <Avatar radius={56} collective={org.collective} />
                    <Flex flexDirection="column" ml={3}>
                      <P color="black.900" mb={1}>
                        {org.collective.name}
                      </P>
                      <P color="black.600">@{org.collective.slug}</P>
                    </Flex>
                  </OrgCard>
                ))}
              </Flex>
            )}
            <Flex px={3} width="100%">
              <P my={2} fontSize="Caption" textTransform="uppercase" color="black.700">
                Create new
              </P>
              <Flex flexGrow={1} alignItems="center">
                <StyledHr width="100%" ml={2} />
              </Flex>
            </Flex>

            <Flex my={2} px={3} flexDirection="column" width="100%">
              {miniForm ? (
                <CreateCollectiveMiniForm
                  type="ORGANIZATION"
                  onCancel={() => this.setState({ miniForm: false })}
                  onSuccess={data => this.setState({ organization: data })}
                  LoggedInUser={LoggedInUser}
                  addLoggedInUserAsAdmin
                />
              ) : (
                <CreateNewOrg alignItems="center" onClick={() => this.setState({ miniForm: true })}>
                  <PlusCircle size="24" color="gray" />
                  <P fontSize="Caption" color="black.800" ml={2}>
                    Create new organization
                  </P>
                </CreateNewOrg>
              )}
            </Flex>
          </Flex>
        </Container>
      </Fragment>
    );
  }
}

export default withUser(injectIntl(AcceptContributionsMyself));
