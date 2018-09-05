import React from 'react';
import PropTypes from 'prop-types';
import { WithOutContext as ReactTags } from 'react-tag-input';

const KeyCodes = {
  comma: 188,
  enter: 13,
};

const delimiters = [KeyCodes.comma, KeyCodes.enter];

class InputTypeTags extends React.Component {

  static propTypes = {
    defaultValue: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
        tags: [
            { id: 'Thailand', text: 'Thailand' },
            { id: 'India', text: 'India' },
          ],
        suggestions: [
            { id: 'USA', text: 'USA' },
            { id: 'Germany', text: 'Germany' },
            { id: 'Austria', text: 'Austria' },
            { id: 'Costa Rica', text: 'Costa Rica' },
            { id: 'Sri Lanka', text: 'Sri Lanka' },
            { id: 'Thailand', text: 'Thailand' },
          ]
    };
    this.handleDelete = this.handleDelete.bind(this);
    this.handleAddition = this.handleAddition.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
  }

  handleDelete(i) {
    const tags = this.state.tags.filter((tag, index) => index !== i);
    this.setState({ tags });
    this.props.onChange(tags);
  }

  handleAddition(tag) {
    const tags = [...this.state.tags, tag];
    this.setState({ tags });
    this.props.onChange(tags);
  }

  handleDrag(tag, currPos, newPos) {
    const tags = [...this.state.tags];
    const newTags = tags.slice();

    newTags.splice(currPos, 1);
    newTags.splice(newPos, 0, tag);

    // re-render
    this.setState({ tags: newTags });
    this.props.onChange(newTags);
  }

  render() {
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
          />
      </div>
    );
  }
}

export default InputTypeTags;
