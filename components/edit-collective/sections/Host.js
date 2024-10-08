import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { get, groupBy } from 'lodash';
import { withRouter } from 'next/router';
import { FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { formatCurrency } from '../../../lib/currency-utils';
import { getWebsiteUrl } from '../../../lib/utils';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import Link from '../../Link';
import MessageBox from '../../MessageBox';
import StyledInput from '../../StyledInput';
import StyledLink from '../../StyledLink';
import { H4 } from '../../Text';
import { Button } from '../../ui/Button';
import CreateHostFormWithData from '../CreateHostFormWithData';
import EditConnectedAccount from '../EditConnectedAccount';

import { ActiveFiscalHost } from './fiscal-host/ActiveFiscalHost';
import AppliedToFiscalHost from './fiscal-host/AppliedToFiscalHost';

const OptionLabel = styled.label`
  display: block;
  font-weight: bold;
  cursor: pointer;
`;

const EditCollectiveHostSection = styled.div`
  h2 label {
    cursor: pointer;
    width: auto;
  }

  select {
    cursor: pointer;
  }
`;

class Host extends React.Component {
  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object.isRequired,
    editCollectiveMutation: PropTypes.func.isRequired,
    router: PropTypes.object.isRequired, // from withRouter
    intl: PropTypes.object.isRequired, // from injectIntl
  };

  constructor(props) {
    super(props);
    this.changeHost = this.changeHost.bind(this);
    this.updateSelectedOption = this.updateSelectedOption.bind(this);
    this.state = {
      collective: props.collective,
      isSubmitting: false,
    };
  }

  updateSelectedOption(option) {
    this.props.router.push({
      pathname: `/dashboard/${this.props.collective.slug}/host`,
      query: {
        selectedOption: option,
      },
    });
  }

  async changeHost(newHost = { id: null }) {
    const { collective } = this.props;

    if (newHost.id === get(collective, 'host.id')) {
      return;
    }

    this.setState({ isSubmitting: true });
    try {
      await this.props.editCollectiveMutation({
        id: collective.id,
        HostCollectiveId: newHost.id,
      });
      if (!newHost.id) {
        this.updateSelectedOption('noHost');
      }
    } finally {
      this.setState({ isSubmitting: false });
    }
  }

  renderLegalNameSetInfoMessage(collective) {
    return (
      <MessageBox type="info" fontSize="13px" withIcon>
        <FormattedMessage
          id="collective.edit.host.legalName.info"
          defaultMessage="Please set the legal name {isSelfHosted, select, false {of the host} other {}} in the Info section of <SettingsLink>the settings</SettingsLink>. This is required if the legal name is different than the display name for tax and accounting purposes."
          values={{
            SettingsLink: getI18nLink({ href: `/dashboard/${collective.host?.slug}` }),
            isSelfHosted: collective.id === collective.host?.id,
          }}
        />
      </MessageBox>
    );
  }

  render() {
    const { LoggedInUser, collective, router, intl, editCollectiveMutation } = this.props;
    const { locale } = intl;

    const selectedOption = get(router, 'query.selectedOption', 'noHost');

    const showLegalNameInfoBox = LoggedInUser?.isHostAdmin(collective) && !collective.host?.legalName;

    if (get(collective, 'host.id') === collective.id) {
      return (
        <div className="flex flex-col space-y-4">
          <p>
            <FormattedMessage
              id="editCollective.selfHost.label"
              defaultMessage="{type, select, COLLECTIVE {Your Collective} FUND {Your Fund} other {Your Account}} hold its own funds; it doesn't use a Fiscal Host."
              values={{
                type: collective.type,
              }}
            />
          </p>
          {collective.stats.balance > 0 && (
            <Fragment>
              <p>
                <FormattedMessage
                  id="editCollective.selfHost.balance"
                  defaultMessage="Current balance: {balance}."
                  values={{
                    balance: formatCurrency(collective.stats.balance, collective.currency, { locale }),
                    type: collective.type,
                  }}
                />{' '}
                <FormattedMessage
                  id="editCollective.selfHost.change.balanceNotEmpty"
                  defaultMessage="To change your Fiscal Host, you first need to empty {type, select, COLLECTIVE {your Collective's balance} FUND {your Fund's balance} other {your balance}} by submitting and paying expenses."
                  values={{
                    type: collective.type,
                  }}
                />
              </p>
            </Fragment>
          )}
          {showLegalNameInfoBox && <Container>{this.renderLegalNameSetInfoMessage(collective)}</Container>}
          {collective.stats.balance === 0 && (
            <Fragment>
              <p>
                <Button onClick={() => this.changeHost()} minWidth={200} loading={this.state.isSubmitting}>
                  <FormattedMessage id="editCollective.selfHost.removeBtn" defaultMessage="Reset Fiscal Host" />
                </Button>
              </p>
            </Fragment>
          )}
        </div>
      );
    }

    if (get(collective, 'host.id')) {
      return (
        <Fragment>
          {!collective.isActive ? (
            <AppliedToFiscalHost collectiveSlug={collective.slug} editCollectiveMutation={editCollectiveMutation} />
          ) : (
            <ActiveFiscalHost collectiveSlug={collective.slug} showLegalNameInfoBox={showLegalNameInfoBox} />
          )}
        </Fragment>
      );
    }

    const connectedAccounts = groupBy(collective.connectedAccounts, 'service');
    const stripeAccount = connectedAccounts['stripe']?.[0];

    return (
      <EditCollectiveHostSection>
        <H4 fontSize="15px" mb={3}>
          <FormattedMessage
            id="acceptContributions.picker.subtitle"
            defaultMessage="Who will hold money on behalf of this Collective?"
          />
        </H4>
        <div id="noHost">
          <Flex>
            <Box flex="0 0 35px" mr={2} pl={2}>
              <StyledInput
                type="radio"
                name="host-radio"
                id="host-radio-noHost"
                checked={selectedOption === 'noHost'}
                onChange={() => this.updateSelectedOption('noHost')}
                className="hostRadio"
              />
            </Box>
            <Box mb={4}>
              <OptionLabel htmlFor="host-radio-noHost">
                <FormattedMessage defaultMessage="No one" id="tcxpLX" />
              </OptionLabel>
              <FormattedMessage
                id="collective.edit.host.noHost.description"
                defaultMessage="You can't receive financial contributions or use the budget features. You can still edit your profile page, submit expenses to be paid later, and post updates."
              />
            </Box>
          </Flex>
        </div>

        <div id="selfHost">
          <Flex>
            <Box flex="0 0 35px" mr={2} pl={2}>
              <StyledInput
                type="radio"
                name="host-radio"
                id="host-radio-selfHost"
                checked={selectedOption === 'selfHost'}
                onChange={() => this.updateSelectedOption('selfHost')}
                className="hostRadio"
              />
            </Box>
            <Box mb={4}>
              <OptionLabel htmlFor="host-radio-selfHost">
                <FormattedMessage id="acceptContributions.picker.ourselves" defaultMessage="Independent Collective" />
              </OptionLabel>
              <FormattedMessage
                id="collective.edit.host.selfHost.description"
                defaultMessage="Simply connect a bank account for a single Collective. You will be responsible for accounting, taxes, payments, and liability."
              />
              &nbsp;
              <StyledLink href="https://docs.opencollective.com/help/independent-collectives" openInNewTab>
                <FormattedMessage id="moreInfo" defaultMessage="More info" />
              </StyledLink>
              {selectedOption === 'selfHost' && LoggedInUser && (
                <Flex
                  flexDirection={['column', 'row', 'row']}
                  justifyContent="space-between"
                  alignItems="flex-end"
                  mt={3}
                >
                  <Box mb={3}>
                    <Button
                      onClick={() => this.changeHost({ id: collective.id })}
                      loading={this.state.isSubmitting}
                      minWidth={200}
                    >
                      <FormattedMessage
                        id="host.selfHost.confirm"
                        defaultMessage="Yes, Activate Independent Collective"
                      />
                    </Button>
                  </Box>
                  {!stripeAccount && (
                    <Box textAlign="right">
                      <EditConnectedAccount
                        collective={collective}
                        service="stripe"
                        options={{
                          redirect: `${getWebsiteUrl()}/dashboard/${collective.slug}/host?selectedOption=selfHost`,
                        }}
                      />
                    </Box>
                  )}
                </Flex>
              )}
            </Box>
          </Flex>
        </div>

        <div id="ownHost">
          <Flex>
            <Box flex="0 0 35px" mr={2} pl={2}>
              <StyledInput
                type="radio"
                id="host-radio-ownHost"
                name="host-radio"
                checked={selectedOption === 'ownHost'}
                onChange={() => this.updateSelectedOption('ownHost')}
                className="hostRadio"
              />
            </Box>
            <Box mb={4}>
              <OptionLabel htmlFor="host-radio-ownHost">
                <FormattedMessage id="acceptContributions.organization.subtitle" defaultMessage="Our Own Fiscal Host" />
              </OptionLabel>
              <FormattedMessage
                id="collective.edit.host.useOwn.description"
                defaultMessage="Select or create your own Fiscal Host, which you manage to hold funds for multiple Collectives, to hold funds and do associated admin for this Collective."
              />
              &nbsp;
              <StyledLink href="https://docs.opencollective.com/help/fiscal-hosts/become-a-fiscal-host" openInNewTab>
                <FormattedMessage id="moreInfo" defaultMessage="More info" />
              </StyledLink>
              {selectedOption === 'ownHost' && LoggedInUser && (
                <CreateHostFormWithData
                  collective={collective}
                  LoggedInUser={LoggedInUser}
                  onSubmit={hostCollective => this.changeHost(hostCollective)}
                />
              )}
            </Box>
          </Flex>
        </div>

        <div id="findHost">
          <Flex>
            <Box flex="0 0 35px" mr={2} pl={2}>
              <StyledInput
                type="radio"
                name="host-radio"
                id="host-radio-findHost"
                checked={selectedOption === 'findHost'}
                onChange={() => this.updateSelectedOption('findHost')}
                className="hostRadio"
              />
            </Box>
            <Box mb={4}>
              <OptionLabel htmlFor="host-radio-findHost">
                <FormattedMessage id="collective.edit.host.findHost.title" defaultMessage="Apply to a Fiscal Host" />
              </OptionLabel>
              <FormattedMessage
                id="collective.edit.host.findHost.description"
                defaultMessage="Join an existing Fiscal Host who will hold funds on your behalf and take care of accounting, taxes, banking, admin, payments, and liability. Most Hosts charge a fee for this service (you can review the details before choosing a Host)."
              />
              {selectedOption === 'findHost' && (
                <div>
                  <Container display="flex" alignItems="baseline" mt={2}>
                    <StyledLink
                      buttonStyle="primary"
                      buttonSize="medium"
                      as={Link}
                      fontSize="13px"
                      href={`${collective.slug}/accept-financial-contributions/host`}
                    >
                      <FormattedMessage defaultMessage="Choose a Fiscal Host" id="j4X/+l" />
                    </StyledLink>
                  </Container>
                </div>
              )}
            </Box>
          </Flex>
        </div>
      </EditCollectiveHostSection>
    );
  }
}

export default withRouter(injectIntl(Host));
