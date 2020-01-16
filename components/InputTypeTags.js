import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';
import { WithContext as ReactTags } from 'react-tag-input';

const KeyCodes = {
  comma: 188,
  enter: 13,
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

class InputTypeTags extends React.Component {
  static propTypes = {
    defaultValue: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    const tags = (props.defaultValue || []).map(t => t.trim());

    this.state = {
      tags: tags.map(t => ({ id: t, text: t })),
      suggestions: [],
    };
    this.handleDelete = this.handleDelete.bind(this);
    this.handleAddition = this.handleAddition.bind(this);
    this.handleDrag = this.handleDrag.bind(this);

    this.messages = defineMessages({
      placeholder: {
        id: 'input.tags.placeholder',
        defaultMessage: 'Add a new tag (then press "enter")',
      },
    });
  }

  handleDelete(i) {
    const tags = this.state.tags.filter((tag, index) => index !== i);
    this.setState({ tags });
    this.props.onChange(tags.map(t => t.id).join(','));
  }

  handleAddition(tag) {
    const tags = [...this.state.tags, tag];
    this.setState({ tags });
    this.props.onChange(tags.map(t => t.id).join(','));
  }

  handleDrag(tag, currPos, newPos) {
    const tags = [...this.state.tags];
    const newTags = tags.slice();

    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);

    // re-render
    this.setState({ tags: newTags });
    this.props.onChange(newTags.map(t => t.id).join(','));
  }

  render() {
    const { intl } = this.props;
    const { tags, suggestions } = this.state;
    return (
      <div>
        <ReactTags
          tags={tags}
          suggestions={suggestions}
          handleDelete={this.handleDelete}
          handleAddition={this.handleAddition}
          handleDrag={this.handleDrag}
          delimiters={delimiters}
          autofocus={false}
          placeholder={intl.formatMessage(this.messages['placeholder'])}
        />
      </div>
    );
  }
}

export default injectIntl(InputTypeTags);
