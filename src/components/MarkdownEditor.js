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
    onChange: PropTypes.func,
    preview: PropTypes.bool
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
      <div className={`${this.props.preview === false ? 'noPreview' : ''} MarkdownEditor`}>
        <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
        <style jsx global>{`
          .MarkdownEditor .react-mde-editor {
            width: 50%;
          }
          .MarkdownEditor.noPreview .react-mde-preview {
            display: none;
          }
          .MarkdownEditor .react-mde-preview {
            width: 50%;
          }
          .MarkdownEditor .column .mde-preview .mde-preview-content {
            padding-top: 5px;
          }
        `}</style>
        <ReactMde
            textAreaProps={{
                id: 'ta1',
                name: 'ta1',
            }}
            value={this.state.reactMdeValue}
            className="column"
            onChange={this.handleChange}
            commands={ReactMdeCommands.getDefaultCommands()}
            />
       </div>
     )
  }
}

export default MarkdownEditor;