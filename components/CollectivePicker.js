import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, defineMessages } from 'react-intl';
import { groupBy, sortBy, last, truncate } from 'lodash';
import memoizeOne from 'memoize-one';
import { Flex } from '@rebass/grid';

import { CollectiveType } from '../lib/constants/collectives';
import StyledSelect from './StyledSelect';
import Avatar from './Avatar';
import { Span } from './Text';
import CollectiveTypePicker from './CollectiveTypePicker';
import Container from './Container';
import StyledCard from './StyledCard';
import CreateCollectiveMiniForm from './CreateCollectiveMiniForm';

const CollectiveTypesI18n = defineMessages({
  [CollectiveType.COLLECTIVE]: {
    id: 'collective.types.collective',
    defaultMessage: '{n, plural, one {collective} other {collectives}}',
  },
  [CollectiveType.ORGANIZATION]: {
    id: 'collective.types.organization',
    defaultMessage: '{n, plural, one {organization} other {organizations}}',
  },
  [CollectiveType.USER]: {
    id: 'collective.types.user',
    defaultMessage: '{n, plural, one {people} other {people}}',
  },
});

const Messages = defineMessages({
  createNew: {
    id: 'CollectivePicker.CreateNew',
    defaultMessage: 'Create new',
  },
  inviteNew: {
    id: 'CollectivePicker.InviteNew',
    defaultMessage: 'Invite new',
  },
});

/**
 * Default label builder used to render a collective. For sections titles and custom options,
 * this will just return the default label.
 */
const DefaultCollectiveLabel = ({ value: collective }) => (
  <Flex alignItems="center">
    <Avatar collective={collective} radius={28} />
    <Flex flexDirection="column" ml={2}>
      <Span fontSize="Caption" lineHeight={1.2} color="black.700">
        {truncate(collective.name, { length: 40 })}
      </Span>
      <Span fontSize="Caption" lineHeight={1.2} color="black.500">
        @{collective.slug}
      </Span>
    </Flex>
  </Flex>
);

DefaultCollectiveLabel.propTypes = {
  value: PropTypes.shape({
    id: PropTypes.number,
    type: PropTypes.string,
    name: PropTypes.string,
    slug: PropTypes.string,
    imageUrl: PropTypes.string,
  }),
};

/**
 * An overset og `StyledSelect` specialized to display, filter and pick a collective from a given list.
 * Accepts all the props from [StyledSelect](#!/StyledSelect).
 *
 * If you want the collectives to be automatically loaded from the API, check `CollectivePickerAsync`.
 */
class CollectivePicker extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      createFormCollectiveType: null,
      menuIsOpen: props.menuIsOpen,
      createdCollectives: [],
    };
  }

  /**
   * Function to generate a single select option
   */
  buildCollectiveOption(collective) {
    return collective === null
      ? null
      : { value: collective, label: collective.name, __collective_picker_collective__: true };
  }

  /**
   * From a collectives list, returns a list of options that can be provided to a `StyledSelect`.
   *
   * @param {Array|null} collectives
   * @param {Boolean} groupByType
   * @param {function} sortFunc
   * @param {object} intl
   */
  getOptionsFromCollectives = memoizeOne((collectives, groupByType, sortFunc, intl) => {
    if (!collectives || collectives.length === 0) {
      return [];
    }

    // If not grouped, just sort the collectives by names and return their options
    if (!groupByType) {
      return sortFunc(collectives).map(this.buildCollectiveOption);
    }

    // Group collectives under categories, sort the categories labels and the collectives inside them
    const collectivesByTypes = groupBy(collectives, 'type');
    const sortedActiveTypes = Object.keys(collectivesByTypes).sort();
    return sortedActiveTypes.map(type => {
      const sectionI18n = CollectiveTypesI18n[type];
      const sortedCollectives = sortFunc(collectivesByTypes[type]);
      const sectionLabel = sectionI18n ? intl.formatMessage(sectionI18n, { n: sortedCollectives.length }) : type;
      return {
        label: sectionLabel || '',
        options: sortedCollectives.map(this.buildCollectiveOption),
      };
    });
  });

  getAllOptions = memoizeOne((collectivesOptions, customOptions, createdCollectives, creatable, intl) => {
    let options = collectivesOptions;

    if (createdCollectives.length > 0) {
      options = [...createdCollectives.map(this.buildCollectiveOption), ...options];
    }

    if (customOptions && customOptions.length > 0) {
      options = [...customOptions, ...options];
    }

    if (creatable) {
      options = [
        ...options,
        {
          label: this.props.types.includes('USER')
            ? intl.formatMessage(Messages.inviteNew).toUpperCase()
            : intl.formatMessage(Messages.createNew).toUpperCase(),
          options: [
            {
              label: null,
              value: null,
              isDisabled: true,
              __collective_picker_new__: true,
              __background__: 'white',
            },
          ],
        },
      ];
    }

    return options;
  });

  onChange = e => {
    this.props.onChange(e);
    if (this.state.showCreatedCollective) {
      this.setState({ showCreatedCollective: false });
    }
  };

  setCreateFormCollectiveType = type => {
    this.setState({ createFormCollectiveType: type || null });
  };

  getMenuIsOpen(menuIsOpenFromProps) {
    if (this.state.createFormCollectiveType || this.props.isDisabled) {
      return false;
    } else if (typeof menuIsOpenFromProps !== 'undefined') {
      return menuIsOpenFromProps;
    } else {
      return this.state.menuIsOpen;
    }
  }

  openMenu = () => this.setState({ menuIsOpen: true });

  closeMenu = () => this.setState({ menuIsOpen: false });

  getDefaultOption = (getDefaultOptionsFromProps, allOptions) => {
    if (this.state.createdCollective) {
      return this.buildCollectiveOption(this.state.createdCollective);
    } else if (getDefaultOptionsFromProps) {
      return getDefaultOptionsFromProps(this.buildCollectiveOption, allOptions);
    }
  };

  getValue = () => {
    if (this.props.collective !== undefined) {
      return this.buildCollectiveOption(this.props.collective);
    } else if (this.state.showCreatedCollective) {
      return this.buildCollectiveOption(last(this.state.createdCollectives));
    } else {
      return this.props.getOptions(this.buildCollectiveOption);
    }
  };

  render() {
    const {
      intl,
      collectives,
      creatable,
      customOptions,
      formatOptionLabel,
      getDefaultOptions,
      groupByType,
      onChange,
      sortFunc,
      types,
      isDisabled,
      menuIsOpen,
      minWidth,
      maxWidth,
      width,
      ...props
    } = this.props;
    const { createFormCollectiveType, createdCollectives } = this.state;
    const collectiveOptions = this.getOptionsFromCollectives(collectives, groupByType, sortFunc, intl);
    const allOptions = this.getAllOptions(collectiveOptions, customOptions, createdCollectives, creatable, intl);

    return (
      <Container position="relative" minWidth={minWidth} maxWidth={maxWidth} width={width}>
        <StyledSelect
          options={allOptions}
          defaultValue={getDefaultOptions && getDefaultOptions(this.buildCollectiveOption, allOptions)}
          menuIsOpen={this.getMenuIsOpen(menuIsOpen)}
          isDisabled={Boolean(createFormCollectiveType) || isDisabled}
          onMenuOpen={this.openMenu}
          onMenuClose={this.closeMenu}
          value={this.getValue()}
          onChange={this.onChange}
          formatOptionLabel={(option, context) => {
            if (option.__collective_picker_collective__) {
              return formatOptionLabel(option, context);
            } else if (option.__collective_picker_new__) {
              return <CollectiveTypePicker onChange={this.setCreateFormCollectiveType} types={types} />;
            } else {
              return option.label;
            }
          }}
          {...props}
        />
        {createFormCollectiveType && (
          <StyledCard position="absolute" p={3} mt={1} width="100%" zIndex={9}>
            <CreateCollectiveMiniForm
              type={createFormCollectiveType}
              onCancel={this.setCreateFormCollectiveType}
              onSuccess={collective => {
                onChange({ label: collective.name, value: collective });
                this.setState(state => ({
                  menuIsOpen: false,
                  createFormCollectiveType: null,
                  createdCollectives: [...state.createdCollectives, collective],
                  showCreatedCollective: true,
                }));
              }}
            />
          </StyledCard>
        )}
      </Container>
    );
  }
}

CollectivePicker.propTypes = {
  /** The list of collectives to display */
  collectives: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      type: PropTypes.string,
      name: PropTypes.string,
    }),
  ),
  /** Custom options to be passed to styled select */
  customOptions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.any,
    }),
  ),
  /** Function to sort collectives. Default to sorty by name */
  sortFunc: PropTypes.func,
  /** Called when value changes */
  onChange: PropTypes.func.isRequired,
  /** Get passed the options list, returns the default one */
  getDefaultOptions: PropTypes.func.isRequired,
  /** Use this to control the component */
  getOptions: PropTypes.func.isRequired,
  /** Function to generate a label from the collective + index */
  formatOptionLabel: PropTypes.func.isRequired,
  /** Whether we should group collectives by type */
  groupByType: PropTypes.bool,
  /** If true, a permanent option to create a collective will be displayed in the select */
  creatable: PropTypes.bool,
  /** Force menu to be open. Ignored during collective creation */
  menuIsOpen: PropTypes.bool,
  /** Disabled */
  isDisabled: PropTypes.bool,
  /** Component min width */
  minWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Component max width */
  maxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Component width */
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** If creatable is true, only these types will be displayed in the create form */
  types: PropTypes.arrayOf(PropTypes.oneOf(Object.values(CollectiveType))),
  /** @ignore from injectIntl */
  intl: PropTypes.object,
  /** Use this to control the value of the component */
  collective: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    type: PropTypes.string,
    name: PropTypes.string,
  }),
};

CollectivePicker.defaultProps = {
  groupByType: true,
  getDefaultOptions: () => undefined,
  getOptions: () => undefined,
  formatOptionLabel: DefaultCollectiveLabel,
  sortFunc: collectives => sortBy(collectives, 'name'),
};

export default injectIntl(CollectivePicker);
