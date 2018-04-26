import React from 'react';
import PropTypes from 'prop-types';
import { upload } from '../lib/api';
import stylesheet from '../../node_modules/react-quill/dist/quill.snow.css';
import classNames from 'classnames';

/*
 * Simple editor component that takes placeholder text as a prop
 */
class HTMLEditor extends React.Component {

  static propTypes = {
    placeholder: PropTypes.string,
    defaultValue: PropTypes.string,
    className: PropTypes.string,
    onChange: PropTypes.func
  };

  constructor (props) {
    super(props)
    this.state = { editorHtml: '', theme: 'snow' }
    this.handleChange = this.handleChange.bind(this)
    this.saveToServer = this.saveToServer.bind(this)
    this.insertToEditor = this.insertToEditor.bind(this)
    if (typeof window !== 'undefined') {
      this.ReactQuill = require('react-quill');
    }

    /*
    * Quill modules to attach to editor
    * See https://quilljs.com/docs/modules/ for complete options
    */
    this.modules = {
      toolbar: {
        container: [
          [{ 'header': '1'}, {'header': '2'}],
          [{size: []}],
          ['bold', 'italic', 'underline', 'blockquote'],
          [{'list': 'ordered'}, {'list': 'bullet'},
          ],
          ['link', 'image', 'video']
        ],
        handlers: {
          'image': () => {
            this.selectLocalImage();
          }
        }
      },
      clipboard: {
        // toggle to add extra line breaks when pasting HTML:
        matchVisual: false,
      }
    }
    /*
    * Quill editor formats
    * See https://quilljs.com/docs/formats/
    */
    this.formats = [
      'header', 'font', 'size',
      'bold', 'italic', 'underline', 'strike', 'blockquote',
      'list', 'bullet', 'indent',
      'link', 'image', 'video'
    ]

  }

  handleChange (html) {
    this.setState({ editorHtml: html });
    this.props.onChange(html);
  }

  selectLocalImage() {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.click();

    // Listen upload local image and save to server
    input.onchange = () => {
      const file = input.files[0];

      // file type is only image.
      if (/^image\//.test(file.type)) {
        this.saveToServer(file);
      } else {
        console.warn('You can only upload images.');
      }
    };
  }

  /**
   * Step2. save to server
   *
   * @param {File} file
   */
  saveToServer(file) {
    upload(file)
      .then(fileUrl => {
        return this.insertToEditor(fileUrl);
      })
      .catch(e => {
        console.error("Error uploading image", e);
      })
  }

  /**
   * Step3. insert image url to rich editor.
   *
   * @param {string} url
   */
  insertToEditor(url) {
    const editor = this.reactQuillRef.getEditor();
    // push image url to rich editor.
    const range = editor.getSelection();
    editor.insertEmbed(range.index, 'image', url);
  }

  render () {

    if (!this.ReactQuill) {
      return (<div />);
    }

    return (
      <div className={classNames("HTMLEditor", this.props.className)}>
        <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
        <style jsx>{`
          .HTMLEditor :global(.quill) {
            height: 1rem;
            min-height: 40rem;
          }
          .HTMLEditor :global(.ql-container) {
            height: 35rem;
          }
          .HTMLEditor.small :global(.quill) {
            height: 1rem;
            min-height: 20rem;
          }
          .HTMLEditor.small :global(.ql-container) {
            height: 15rem;
          }
        `}</style>
        <this.ReactQuill
          ref={el => this.reactQuillRef = el}
          theme="snow"
          onChange={this.handleChange}
          // value={this.state.editorHtml}
          defaultValue={this.props.defaultValue}
          modules={this.modules}
          formats={this.formats}
          bounds={'.app'}
          placeholder={this.props.placeholder}
         />
       </div>
     )
  }
}

// // quill editor add image handler
// HTMLEditor.getModule('toolbar').addHandler('image', () => {
//   selectLocalImage();
// });

export default HTMLEditor;
