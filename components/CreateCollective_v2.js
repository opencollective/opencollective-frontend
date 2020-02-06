import React from 'react';
import PropTypes from 'prop-types';
import Page from './Page';
import { Span, P, H1, H2, H3, H4, H5 } from './Text';
import Container from './Container';
import StyledButton from './StyledButton';
import Illustration from './home/HomeIllustration';
import { addCreateCollectiveMutation } from '../lib/graphql/mutations';
import CreateCollectiveForm from './CreateCollectiveForm';
import CreateCollectiveCover from './CreateCollectiveCover';
import ErrorPage from './ErrorPage';
import SignInOrJoinFree from './SignInOrJoinFree';
import { get } from 'lodash';
import { Flex, Box } from '@rebass/grid';
import styled, { css } from 'styled-components';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
import { Router, Link } from '../server/pages';
import { withUser } from './UserProvider';
import { getErrorFromGraphqlException } from '../lib/utils';

class CreateCollective extends React.Component {
  static propTypes = {
    host: PropTypes.object,
    LoggedInUser: PropTypes.object, // from withUser
    refetchLoggedInUser: PropTypes.func.isRequired, // from withUser
    intl: PropTypes.object.isRequired,
    createCollective: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = { collective: { type: 'COLLECTIVE' }, result: {} };
    this.createCollective = this.createCollective.bind(this);
    this.error = this.error.bind(this);
    this.resetError = this.resetError.bind(this);
    this.messages = defineMessages({
      'host.apply.title': {
        id: 'host.apply.title',
        defaultMessage: 'Apply to create a new {hostname} collective',
      },
      'collective.create.title': {
        id: 'collective.create.title',
        defaultMessage: 'Create an Open Collective',
      },
      'collective.create.description': {
        id: 'collective.create.description',
        defaultMessage: 'The place for your community to collect money and share your finance in full transparency.',
      },
    });

    this.host = props.host || {
      type: 'COLLECTIVE',
      settings: {
        apply: {
          title: this.props.intl.formatMessage(this.messages['collective.create.title']),
          description: this.props.intl.formatMessage(this.messages['collective.create.description']),
          categories: [
            'association',
            'coop',
            'lobby',
            'meetup',
            'movement',
            'neighborhood',
            'opensource',
            'politicalparty',
            'pta',
            'studentclub',
            'other',
          ],
        },
      },
    };

    this.next = props.host ? `/${props.host.slug}/apply` : '/create';
  }

  error(msg) {
    this.setState({ result: { error: msg } });
  }

  resetError() {
    this.error();
  }

  async createCollective(CollectiveInputType) {
    if (!CollectiveInputType.tos) {
      this.setState({
        result: { error: 'Please accept the terms of service' },
      });
      return;
    }
    if (get(this.host, 'settings.tos') && !CollectiveInputType.hostTos) {
      this.setState({
        result: { error: 'Please accept the terms of fiscal sponsorship' },
      });
      return;
    }
    this.setState({ status: 'loading' });
    CollectiveInputType.type = 'COLLECTIVE';
    CollectiveInputType.HostCollectiveId = this.host.id;
    if (CollectiveInputType.tags) {
      // Meetup returns an array of tags, while the regular input stores a string
      if (typeof CollectiveInputType.tags === 'string') {
        CollectiveInputType.tags.split(',');
      }

      CollectiveInputType.tags =
        Array.isArray(CollectiveInputType.tags) && CollectiveInputType.tags.length > 0
          ? CollectiveInputType.tags.map(t => t.trim())
          : null;
    }
    CollectiveInputType.tags = [...(CollectiveInputType.tags || []), ...(this.host.tags || [])] || [];
    if (CollectiveInputType.category) {
      CollectiveInputType.tags.push(CollectiveInputType.category);
    }
    CollectiveInputType.data = CollectiveInputType.data || {};
    CollectiveInputType.data.members = CollectiveInputType.members;
    CollectiveInputType.data.meetupSlug = CollectiveInputType.meetup;
    delete CollectiveInputType.category;
    delete CollectiveInputType.tos;
    delete CollectiveInputType.hostTos;
    try {
      const res = await this.props.createCollective(CollectiveInputType);
      const collective = res.data.createCollective;
      const successParams = {
        slug: collective.slug,
      };
      this.setState({
        status: 'idle',
        result: { success: 'Collective created successfully' },
      });

      await this.props.refetchLoggedInUser();
      if (CollectiveInputType.HostCollectiveId) {
        successParams.status = 'collectiveCreated';
        successParams.CollectiveId = collective.id;
        successParams.collectiveSlug = collective.slug;
        Router.pushRoute('collective', {
          slug: collective.slug,
          status: 'collectiveCreated',
          CollectiveId: collective.id,
          CollectiveSlug: collective.slug,
        });
      } else {
        Router.pushRoute('editCollective', { slug: collective.slug, section: 'host' });
      }
    } catch (err) {
      const errorMsg = getErrorFromGraphqlException(err).message;
      this.setState({ status: 'idle', result: { error: errorMsg } });
      throw new Error(errorMsg);
    }
  }

  render() {
    const { LoggedInUser, intl } = this.props;

    const canApply = get(this.host, 'settings.apply');
    const title =
      get(this.host, 'settings.apply.title') ||
      intl.formatMessage(this.messages['host.apply.title'], {
        hostname: this.host.name,
      });
    const description =
      get(this.host, 'settings.apply.description') ||
      intl.formatMessage(this.messages['collective.create.description'], {
        hostname: this.host.name,
      });

    if (!this.host) {
      return <ErrorPage loading />;
    }

    if (!LoggedInUser) {
      return (
        <Page>
          <Flex justifyContent="center" p={5}>
            <SignInOrJoinFree />
          </Flex>
        </Page>
      );
    }

    const ExamplesLink = styled.a`
      color: #297eff;

      &:hover {
        color: #dc5f7d;
      }
    `;

    return (
      <Page>
        <div className="CreateCollective">
          <Flex flexDirection="column" justifyContent="center" alignItems="center" p={5}>
            <H1
              fontSize={['H3', null, 'H1']}
              lineHeight={['H3', null, 'H1']}
              fontWeight="bold"
              textAlign="center"
              mb={4}
            >
              <FormattedMessage id="home.create" defaultMessage="Create a Collective" />
            </H1>
            <Box alignItems="center" p={3}>
              <Flex justifyContent="center" alignItems="center" p={4}>
                <Box alignItems="center" width={['400px']} p={3}>
                  <Flex flexDirection="column" justifyContent="center" alignItems="center" p={1}>
                    <Illustration
                      src="/static/images/createcollective-opensource.png"
                      display={['none', null, null, 'block']}
                      alt="For open source projects"
                    />
                    <StyledButton buttonSize="large" buttonStyle="primary" mb={4} px={4}>
                      <FormattedMessage id="createCollective.opensource" defaultMessage="For open source projects" />
                    </StyledButton>
                    <ExamplesLink href="#">
                      <FormattedMessage id="createCollective.examples" defaultMessage="See examples" />
                    </ExamplesLink>
                  </Flex>
                </Box>
                <Box alignItems="center" width={['400px']} p={3}>
                  <Flex flexDirection="column" justifyContent="center" alignItems="center" p={1}>
                    <Illustration
                      src="/static/images/createcollective-anycommunity.png"
                      display={['none', null, null, 'block']}
                      alt="For any community"
                    />
                    <StyledButton buttonSize="large" buttonStyle="primary" mb={4} px={4}>
                      <FormattedMessage id="createCollective.anycommunity" defaultMessage="For any community" />
                    </StyledButton>
                    <ExamplesLink href="#">
                      <FormattedMessage id="createCollective.examples" defaultMessage="See examples" />
                    </ExamplesLink>
                  </Flex>
                </Box>
                <Box alignItems="center" width={['400px']} p={3}>
                  <Flex flexDirection="column" justifyContent="center" alignItems="center" p={1}>
                    <Illustration
                      src="/static/images/createcollective-climateinitiative.png"
                      display={['none', null, null, 'block']}
                      alt="For climate initiatives"
                    />
                    <StyledButton buttonSize="large" buttonStyle="primary" mb={4} px={4}>
                      <FormattedMessage id="createCollective.climate" defaultMessage="For climate initiatives" />
                    </StyledButton>
                    <ExamplesLink href="#">
                      <FormattedMessage id="createCollective.examples" defaultMessage="See examples" />
                    </ExamplesLink>
                  </Flex>
                </Box>
              </Flex>
            </Box>
          </Flex>
        </div>
      </Page>
    );
  }
}

export default injectIntl(withUser(addCreateCollectiveMutation(CreateCollective)));
