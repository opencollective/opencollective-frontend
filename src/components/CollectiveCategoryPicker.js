import React from 'react';
import PropTypes from 'prop-types';
import colors from '../constants/colors';
import withIntl from '../lib/withIntl';
import { defineMessages } from 'react-intl';

class CollectiveCategoryPicker extends React.Component {

  static propTypes = {
    categories: PropTypes.arrayOf(PropTypes.string),
    defaultValue: PropTypes.string,
    onChange: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props);
    this.state = { category: null };
    this.handleChange = this.handleChange.bind(this);
    this.renderCategory = this.renderCategory.bind(this);

    this.messages = defineMessages({
      'category.label': { id: 'collective.category.label', defaultMessage: 'Category' },
      'association': { id: 'collective.category.association', defaultMessage: 'Association' },
      'pta': { id: 'collective.category.pta', defaultMessage: 'Parent Teacher Association' },
      'other': { id: 'collective.category.other', defaultMessage: 'Other' },
      'studentclub': { id: 'collective.category.studentclub', defaultMessage: 'Student Club' },
      'meetup': { id: 'collective.category.meetup', defaultMessage: 'Meetup' },
      'movement': { id: 'collective.category.movement', defaultMessage: 'Movement' },
      'neighborhood': { id: 'collective.category.neighborhood', defaultMessage: 'Neighborhood Association' },
      'opensource': { id: 'collective.category.opensource', defaultMessage: 'Open Source Project' },
      'politicalparty': { id: 'collective.category.politicalparty', defaultMessage: 'Political Party' },
      'lobby': { id: 'collective.category.lobby', defaultMessage: 'Lobbying Group' },
      'coop': { id: 'collective.category.coop', defaultMessage: 'Cooperative' }
    });

  }

  handleChange(category) {
    this.setState({category});
    this.props.onChange(category);
  }

  renderCategory(category) {
    const { intl } = this.props;

    return (
      <div className="category" onClick={() => this.handleChange(category)}>
        <style jsx>{`
          .category {
            width: 180px;
            height: 90px;
            text-align: center;
            padding: 0.5rem;
            background: ${colors.blue};
            color: white;
            margin: 2rem;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            font-size: 2rem;
            border-radius: 1rem;
          }
        `}</style>
        {intl.formatMessage(this.messages[category])}
      </div>
    );
  }

  render() {
    const { intl, categories } = this.props;

    return (
      <div className="CollectiveCategoryPicker">
        <style jsx>{`
          .CollectiveCategoryPicker {
            margin: 0 auto;
            display: flex;
            flex-wrap: wrap;
          }
          label {
            margin-left: 5px;
            margin-right: 5px;
            width: auto;
          }
        `}</style>

        { !this.state.category && categories.map(this.renderCategory) }

        { this.state.category &&
          <div>
            <label>{intl.formatMessage(this.messages['category.label'])}:</label>
            {intl.formatMessage(this.messages[this.state.category])} (<a onClick={() => this.handleChange(null)}>change</a>)
          </div>
        }
      </div>
    );
  }

}

export default withIntl(CollectiveCategoryPicker);
