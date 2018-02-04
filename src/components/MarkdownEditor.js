import React from 'react';
import PropTypes from 'prop-types';
import ReactMde, { ReactMdeCommands } from 'react-mde';
import stylesheet from '../../node_modules/react-mde/lib/styles/css/react-mde-all.css';

/* 
 * Simple editor component that takes placeholder text as a prop 
 */
class MarkdownEditor extends React.Component {

  static propTypes = {
    placeholder: PropTypes.string,
    defaultValue: PropTypes.string,
    onChange: PropTypes.func
  };

  constructor (props) {
    super(props)
    this.handleChange = this.handleChange.bind(this);
    this.state = {
      reactMdeValue: { text: props.defaultValue, selection: null }
    };
  }
  
  handleChange(value) {
    this.setState({ reactMdeValue: value });
    this.props.onChange(value.text);
  }

  render () {
    return (
      <div className="MarkdownEditor">
        <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
        <ReactMde
            textAreaProps={{
                id: 'ta1',
                name: 'ta1',
            }}
            value={this.state.reactMdeValue}
            onChange={this.handleChange}
            commands={ReactMdeCommands.getDefaultCommands()}
            />
       </div>
     )
  }
}

export default MarkdownEditor;