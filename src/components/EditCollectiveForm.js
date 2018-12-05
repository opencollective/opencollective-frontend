import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import InputField from './InputField';
import EditTiers from './EditTiers';
import EditGoals from './EditGoals';
import EditHost from './EditHost';
import EditMembers from './EditMembers';
import EditPaymentMethods from './EditPaymentMethods';
import EditConnectedAccounts from './EditConnectedAccounts';
import ExportData from './ExportData';
import { FormattedMessage, defineMessages } from 'react-intl';
import { defaultBackgroundImage } from '../constants/collectives';
import withIntl from '../lib/withIntl';
import { Button } from 'react-bootstrap';
import Link from './Link';
import { get } from 'lodash';
import styled, { css } from 'styled-components';
import { Flex, Box } from '@rebass/grid';
import EditVirtualCards from './EditVirtualCards';

const selectedStyle = css`
  background-color: #eee;
  color: black;
`;

const MenuItem = styled(Link)`
  display: block;
  border-radius: 5px;
  padding: 5px 10px;
  color: #888;
  cursor: pointer;
  &:hover,
  a:hover {
    color: black;
  }
  ${({ selected }) => selected && selectedStyle};
`;

class EditCollectiveForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    status: PropTypes.string, // loading, saved
    onSubmit: PropTypes.func,
    LoggedInUser: PropTypes.object.isRequired,
    /** Provided by withRouter */
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleObjectChange = this.handleObjectChange.bind(this);

    const collective = { ...(props.collective || {}) };
    collective.slug = collective.slug ? collective.slug.replace(/.*\//, '') : '';

    this.state = {
      modified: false,
      section: 'info',
      collective,
      members: collective.members || [{}],
      tiers: collective.tiers || [{}],
      goals: collective.settings.goals || [{}],
      paymentMethods: collective.paymentMethods || [{}],
    };

    this.showEditTiers = ['COLLECTIVE', 'EVENT'].includes(collective.type);
    this.showExpenses = collective.type === 'COLLECTIVE' || collective.isHost;
    this.showEditGoals = collective.type === 'COLLECTIVE';
    this.showHost = collective.type === 'COLLECTIVE';
    this.defaultTierType = collective.type === 'EVENT' ? 'TICKET' : 'TIER';
    this.showEditMembers = ['COLLECTIVE', 'ORGANIZATION'].includes(collective.type);
    this.showPaymentMethods = ['USER', 'ORGANIZATION'].includes(collective.type);
    this.showVirtualCards = collective.canCreateVirtualCards;
    this.members = collective.members && collective.members.filter(m => ['ADMIN', 'MEMBER'].includes(m.role));

    this.messages = defineMessages({
      loading: { id: 'loading', defaultMessage: 'loading' },
      save: { id: 'save', defaultMessage: 'save' },
      saved: { id: 'saved', defaultMessage: 'saved' },
      'event.create.btn': {
        id: 'event.create.btn',
        defaultMessage: 'Create Event',
      },
      'slug.label': {
        id: 'collective.slug.label',
        defaultMessage: 'Change your URL',
      },
      'type.label': { id: 'collective.type.label', defaultMessage: 'type' },
      'name.label': { id: 'collective.name.label', defaultMessage: 'name' },
      'tags.label': { id: 'collective.tags.label', defaultMessage: 'tags' },
      'tos.label': {
        id: 'collective.tos.label',
        defaultMessage: 'Terms of Service',
      },
      'tos.description': {
        id: 'collective.tos.description',
        defaultMessage: 'Link to the terms by which this host will collect money on behalf of their collectives',
      },
      'tags.description': {
        id: 'collective.tags.description',
        defaultMessage: 'Make your collective discoverable in search and related collectives (comma separated)',
      },
      'company.label': {
        id: 'collective.company.label',
        defaultMessage: 'company',
      },
      'company.description': {
        id: 'collective.company.description',
        defaultMessage: 'Start with a @ to reference an organization (e.g. @airbnb)',
      },
      'amount.label': {
        id: 'collective.amount.label',
        defaultMessage: 'amount',
      },
      'description.label': {
        id: 'collective.description.label',
        defaultMessage: 'Short description',
      },
      'longDescription.label': {
        id: 'collective.longDescription.label',
        defaultMessage: 'Long description',
      },
      'expensePolicy.label': {
        id: 'collective.expensePolicy.label',
        defaultMessage: 'Expense policy',
      },
      'expensePolicy.description': {
        id: 'collective.expensePolicy.description',
        defaultMessage:
          'It can be daunting for the community to file an expense. Help them by providing a clear expense policy to explain what they can expense.',
      },
      'expensePolicy.placeholder': {
        id: 'collective.expensePolicy.placeholder',
        defaultMessage:
          'E.g. Feel free to expense your public transport or Uber/Lyft drive for up to XX. You can also expense drinks and food for meetups for up to XX. For other types of expenses, feel free to ask us.',
      },
      'startsAt.label': {
        id: 'collective.startsAt.label',
        defaultMessage: 'start date and time',
      },
      'image.label': { id: 'collective.image.label', defaultMessage: 'Avatar' },
      'backgroundImage.label': {
        id: 'collective.backgroundImage.label',
        defaultMessage: 'Cover image',
      },
      'twitterHandle.label': {
        id: 'collective.twitterHandle.label',
        defaultMessage: 'Twitter',
      },
      'githubHandle.label': {
        id: 'collective.githubHandle.label',
        defaultMessage: 'Github',
      },
      'website.label': {
        id: 'collective.website.label',
        defaultMessage: 'Website',
      },
      'markdown.label': {
        id: 'collective.markdown.label',
        defaultMessage: 'Default editor',
      },
      'markdown.description': {
        id: 'collective.markdown.description',
        defaultMessage: 'Use markdown editor',
      },
      'sendInvoiceByEmail.label': {
        id: 'collective.sendInvoiceByEmail.label',
        defaultMessage: 'Invoices',
      },
      'sendInvoiceByEmail.description': {
        id: 'collective.sendInvoiceByEmail.description',
        defaultMessage: 'Automatically attach the PDF of your receipts to the monthly report email',
      },
      'location.label': {
        id: 'collective.location.label',
        defaultMessage: 'City',
      },
    });

    collective.backgroundImage = collective.backgroundImage || defaultBackgroundImage[collective.type];

    window.OC = { collective, state: this.state };
  }

  componentDidMount() {
    const hash = window.location.hash;

    if (this.props.router.query.section) {
      this.setState({ section: this.props.router.query.section });
    } else if (hash) {
      // Legacy route converter - sections used to be assigned to URLs looking
      // like `/collective/edit#paymentMethods. We have migrated them to proper
      // routes (like `/collective/edit/payment-methods`) but we keep this
      // legacy redirect for old emails sent with the old URL scheme
      // Deprecated on 2018-12-08
      const legacySections = [
        'info',
        'images',
        'members',
        'payment-methods',
        'gift-cards',
        'connected-accounts',
        'advanced',
      ];
      let section = hash.substr(1);
      if (section === 'connectedAccounts') section = 'connected-accounts';
      else if (section === 'paymentMethods') section = 'payment-methods';
      if (legacySections.includes(section)) this.props.router.push(`/${this.props.collective.slug}/edit/${section}`);
    }
  }

  componentDidUpdate(oldProps) {
    const { collective, router } = this.props;
    if (oldProps.collective !== collective) {
      this.setState({
        collective: collective,
        tiers: collective.tiers,
        paymentMethods: collective.paymentMethods,
      });
    } else if (oldProps.router.query.section !== router.query.section) {
      this.setState({ section: router.query.section });
    }
  }

  handleChange(fieldname, value) {
    const collective = {};
    collective[fieldname] = value;
    this.setState({
      modified: true,
      collective: Object.assign({}, this.state.collective, collective),
    });
  }

  handleObjectChange(obj) {
    this.setState({ ...obj, modified: true });
    window.state = this.state;
  }

  async handleSubmit() {
    const collective = {
      ...this.state.collective,
      tiers: this.state.tiers,
      goals: this.state.goals,
      members: this.state.members,
      paymentMethods: this.state.paymentMethods,
    };
    this.props.onSubmit(collective);
    this.setState({ modified: false });
  }

  render() {
    const { collective, status, intl, LoggedInUser } = this.props;

    const isNew = !(collective && collective.id);
    let submitBtnMessageId = isNew ? 'event.create.btn' : 'save';
    if (['loading', 'saved'].includes(status)) {
      submitBtnMessageId = status;
    }
    console.log('>>> submitBtnMessageId', submitBtnMessageId);
    const submitBtnLabel = this.messages[submitBtnMessageId] && intl.formatMessage(this.messages[submitBtnMessageId]);
    const defaultStartsAt = new Date();
    const type = collective.type.toLowerCase();
    defaultStartsAt.setHours(19);
    defaultStartsAt.setMinutes(0);

    this.fields = {
      info: [
        {
          name: 'name',
          placeholder: '',
          maxLength: 255,
        },
        {
          name: 'company',
          placeholder: '',
          maxLength: 255,
          when: () => collective.type === 'USER',
        },
        {
          name: 'description',
          type: 'text',
          maxLength: 255,
          placeholder: '',
        },
        {
          name: 'twitterHandle',
          type: 'text',
          pre: 'https://twitter.com/',
          maxLength: 255,
          placeholder: '',
        },
        {
          name: 'githubHandle',
          type: 'text',
          pre: 'https://github.com/',
          maxLength: 39,
          placeholder: '',
        },
        {
          name: 'website',
          type: 'text',
          maxLength: 255,
          placeholder: '',
        },
        // {
        //   name: 'location',
        //   placeholder: 'Search cities',
        //   type: 'location',
        //   options: {
        //     types: ['cities']
        //   }
        // },
        {
          name: 'longDescription',
          type: 'textarea',
          placeholder: '',
          description: 'Protip: you can use markdown',
        },
        {
          name: 'tags',
          maxLength: 128,
          type: 'tags',
          placeholder: 'meetup, javascript',
        },
        {
          name: 'tos',
          type: 'text',
          placeholder: '',
          defaultValue: get(this.state.collective, 'settings.tos'),
          when: () => get(this.state.collective, 'isHost'),
        },
      ],
      images: [
        {
          name: 'image',
          type: 'dropzone',
          placeholder: 'Drop an image or click to upload',
          className: 'horizontal',
          when: () => this.state.section === 'images',
        },
        {
          name: 'backgroundImage',
          type: 'dropzone',
          placeholder: 'Drop an image or click to upload',
          className: 'horizontal',
          when: () => this.state.section === 'images',
        },
      ],
      expenses: [
        {
          name: 'expensePolicy',
          type: 'textarea',
          description: 'Protip: you can use markdown',
        },
      ],
      advanced: [
        {
          name: 'slug',
          pre: 'https://opencollective.com/',
          placeholder: '',
          when: () => this.state.section === 'advanced',
        },
        {
          name: 'sendInvoiceByEmail',
          type: 'switch',
          defaultValue: get(this.state.collective, 'settings.sendInvoiceByEmail'),
          when: () =>
            this.state.section === 'advanced' && (collective.type === 'USER' || collective.type === 'ORGANIZATION'),
        },
        {
          name: 'markdown',
          type: 'switch',
          defaultValue: get(this.state.collective, 'settings.editor') === 'markdown',
          when: () =>
            this.state.section === 'advanced' && (collective.type === 'USER' || collective.type === 'COLLECTIVE'),
        },
      ],
    };

    Object.keys(this.fields).map(fieldname => {
      this.fields[fieldname] = this.fields[fieldname].map(field => {
        if (this.messages[`${field.name}.label`]) {
          field.label = intl.formatMessage(this.messages[`${field.name}.label`]);
        }
        if (this.messages[`${field.name}.description`]) {
          field.description = intl.formatMessage(this.messages[`${field.name}.description`], collective);
        }
        if (this.messages[`${field.name}.placeholder`]) {
          field.placeholder = intl.formatMessage(this.messages[`${field.name}.placeholder`]);
        }
        return field;
      });
    });

    return (
      <div className="EditCollectiveForm">
        <style jsx>
          {`
            :global(.field) {
              margin: 1rem;
            }
            :global(label) {
              width: 150px;
              display: inline-block;
              vertical-align: top;
            }
            :global(input),
            select,
            :global(textarea) {
              width: 300px;
              font-size: 1.5rem;
            }

            .FormInputs {
              overflow: hidden;
            }

            .EditCollectiveForm :global(textarea[name='longDescription']) {
              height: 30rem;
            }

            .EditCollectiveForm :global(textarea[name='expensePolicy']) {
              height: 30rem;
            }

            .actions {
              margin: 5rem auto 1rem;
              text-align: center;
            }
            .backToProfile {
              font-size: 1.3rem;
              margin: 1rem;
            }
          `}
        </style>
        <style global jsx>
          {`
            section#location {
              margin-top: 0;
            }

            .image .InputTypeDropzone {
              width: 100px;
            }

            .backgroundImage-dropzone {
              max-width: 500px;
              overflow: hidden;
            }

            .user .image-dropzone {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              overflow: hidden;
            }

            .menu {
              text-align: center;
              margin: 1rem 0 3rem 0;
            }
          `}
        </style>

        <Flex>
          <Box width={1 / 5} mr={4}>
            <MenuItem
              selected={this.state.section === 'info'}
              route="editCollectiveSection"
              params={{ slug: collective.slug, section: 'info' }}
              className="MenuItem info"
            >
              <FormattedMessage id="editCollective.menu.info" defaultMessage="Info" />
            </MenuItem>
            <MenuItem
              selected={this.state.section === 'images'}
              route="editCollectiveSection"
              params={{ slug: collective.slug, section: 'images' }}
              className="MenuItem images"
            >
              <FormattedMessage id="editCollective.menu." defaultMessage="Images" />
            </MenuItem>
            {this.showEditMembers && (
              <MenuItem
                selected={this.state.section === 'members'}
                route="editCollectiveSection"
                params={{ slug: collective.slug, section: 'members' }}
                className="MenuItem members"
              >
                <FormattedMessage id="editCollective.menu.members" defaultMessage="Members" />
              </MenuItem>
            )}
            {this.showEditGoals && (
              <MenuItem
                selected={this.state.section === 'goals'}
                route="editCollectiveSection"
                params={{ slug: collective.slug, section: 'goals' }}
                className="MenuItem goals"
              >
                <FormattedMessage id="editCollective.menu.goals" defaultMessage="Goals" />
              </MenuItem>
            )}
            {this.showHost && (
              <MenuItem
                selected={this.state.section === 'host'}
                route="editCollectiveSection"
                params={{ slug: collective.slug, section: 'host' }}
                className="MenuItem host"
              >
                <FormattedMessage id="editCollective.menu.host" defaultMessage="Fiscal Host" />
              </MenuItem>
            )}
            {this.showEditTiers && (
              <MenuItem
                selected={this.state.section === 'tiers'}
                route="editCollectiveSection"
                params={{ slug: collective.slug, section: 'tiers' }}
                className="MenuItem tiers"
              >
                <FormattedMessage id="editCollective.menu.tiers" defaultMessage="Tiers" />
              </MenuItem>
            )}
            {this.showExpenses && (
              <MenuItem
                selected={this.state.section === 'expenses'}
                route="editCollectiveSection"
                params={{ slug: collective.slug, section: 'expenses' }}
                className="MenuItem expenses"
              >
                <FormattedMessage id="editCollective.menu.expenses" defaultMessage="Expenses" />
              </MenuItem>
            )}
            {this.showPaymentMethods && (
              <MenuItem
                selected={this.state.section === 'payment-methods'}
                route="editCollectiveSection"
                params={{ slug: collective.slug, section: 'payment-methods' }}
                className="MenuItem paymentMethods"
              >
                <FormattedMessage id="editCollective.menu.paymentMethods" defaultMessage="Payment Methods" />
              </MenuItem>
            )}
            {this.showVirtualCards && (
              <MenuItem
                selected={this.state.section === 'gift-cards'}
                route="editCollectiveSection"
                params={{ slug: collective.slug, section: 'gift-cards' }}
                className="MenuItem gift-cards"
              >
                <FormattedMessage id="editCollective.menu.virtualCards" defaultMessage="Gift Cards" />
              </MenuItem>
            )}
            <MenuItem
              selected={this.state.section === 'connected-accounts'}
              route="editCollectiveSection"
              params={{ slug: collective.slug, section: 'connected-accounts' }}
              className="MenuItem connectedAccounts"
            >
              <FormattedMessage id="editCollective.menu.connectedAccounts" defaultMessage="Connected Accounts" />
            </MenuItem>
            {collective.type === 'COLLECTIVE' && (
              <MenuItem
                selected={this.state.section === 'export'}
                route="editCollectiveSection"
                params={{ slug: collective.slug, section: 'export' }}
                className="MenuItem export"
              >
                <FormattedMessage id="editCollective.menu.export" defaultMessage="Export" />
              </MenuItem>
            )}
            <MenuItem
              selected={this.state.section === 'advanced'}
              route="editCollectiveSection"
              params={{ slug: collective.slug, section: 'advanced' }}
              className="MenuItem advanced"
            >
              <FormattedMessage id="editCollective.menu.advanced" defaultMessage="Advanced" />
            </MenuItem>
          </Box>

          <Box width={4 / 5}>
            <div className="FormInputs">
              {Object.keys(this.fields).map(
                section =>
                  this.state.section === section && (
                    <div className="inputs" key={section}>
                      {this.fields[section].map(
                        field =>
                          (!field.when || field.when()) && (
                            <InputField
                              key={field.name}
                              className={field.className}
                              defaultValue={field.defaultValue || this.state.collective[field.name]}
                              validate={field.validate}
                              ref={field.name}
                              name={field.name}
                              label={field.label}
                              description={field.description}
                              options={field.options}
                              placeholder={field.placeholder}
                              type={field.type}
                              pre={field.pre}
                              context={this.state.collective}
                              onChange={value => this.handleChange(field.name, value)}
                            />
                          ),
                      )}
                    </div>
                  ),
              )}
              {this.state.section === 'members' && (
                <EditMembers
                  title="Edit members"
                  members={this.members}
                  collective={collective}
                  onChange={this.handleObjectChange}
                />
              )}
              {this.state.section === 'tiers' && (
                <EditTiers
                  title="Tiers"
                  types={['TIER', 'MEMBERSHIP', 'SERVICE', 'PRODUCT', 'DONATION']}
                  tiers={this.state.tiers}
                  collective={collective}
                  currency={collective.currency}
                  onChange={this.handleObjectChange}
                  defaultType={this.defaultTierType}
                />
              )}
              {this.state.section === 'goals' && (
                <EditGoals
                  title="goals"
                  goals={this.state.goals}
                  collective={collective}
                  currency={collective.currency}
                  onChange={this.handleObjectChange}
                />
              )}
              {this.state.section === 'host' && (
                <EditHost
                  collective={collective}
                  LoggedInUser={LoggedInUser}
                  editCollectiveMutation={this.props.onSubmit}
                />
              )}
              {this.state.section === 'payment-methods' && (
                <EditPaymentMethods
                  paymentMethods={this.state.paymentMethods}
                  collective={collective}
                  onChange={this.handleObjectChange}
                />
              )}
              {this.state.section === 'gift-cards' && <EditVirtualCards collectiveId={collective.id} />}
              {this.state.section === 'connected-accounts' && (
                <EditConnectedAccounts collective={collective} connectedAccounts={collective.connectedAccounts} />
              )}
              {this.state.section === 'export' && <ExportData collective={collective} />}
            </div>

            {['export', 'connected-accounts', 'host', 'gift-cards'].indexOf(this.state.section) === -1 && (
              <div className="actions">
                <Button
                  bsStyle="primary"
                  type="submit"
                  onClick={this.handleSubmit}
                  disabled={status === 'loading' || !this.state.modified}
                >
                  {submitBtnLabel}
                </Button>
                <div className="backToProfile">
                  <Link route="collective" params={{ slug: collective.slug }}>
                    <FormattedMessage
                      id="collective.edit.backToProfile"
                      defaultMessage="view the {type} page"
                      values={{ type }}
                    />
                  </Link>
                </div>
              </div>
            )}
          </Box>
        </Flex>
      </div>
    );
  }
}

export default withRouter(withIntl(EditCollectiveForm));
