import React from 'react';
import PropTypes from 'prop-types';

/* 
 * Simple editor component that takes placeholder text as a prop 
 */
class HTMLEditor extends React.Component {

  static propTypes = {
    placeholder: PropTypes.string
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
          [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
          [{size: []}],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [{'list': 'ordered'}, {'list': 'bullet'}, 
          {'indent': '-1'}, {'indent': '+1'}],
          ['link', 'image', 'video'],
          ['clean']
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
    console.log(">>> html: ", html);
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
        console.warn('You could only upload images.');
      }
    };
  }

  /**
   * Step2. save to server
   *
   * @param {File} file
   */
  saveToServer(file: File) {
    console.log(">>> saveToServer");
    return this.insertToEditor("https://d.pr/i/BIMCK1+");
    const fd = new FormData();
    fd.append('image', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:3000/upload/image', true);
    xhr.onload = () => {
      if (xhr.status === 200) {
        // this is callback data: url
        const url = JSON.parse(xhr.responseText).data;
        this.insertToEditor(url);
      }
    };
    xhr.send(fd);
  }

  /**
   * Step3. insert image url to rich editor.
   *
   * @param {string} url
   */
  insertToEditor(url: string) {
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
      <div>
        <this.ReactQuill 
          ref={(el) => { this.reactQuillRef = el }}
          theme="snow"
          onChange={this.handleChange}
          value={this.state.editorHtml}
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