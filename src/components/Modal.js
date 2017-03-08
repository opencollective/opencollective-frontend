import React from 'react';
import '../styles/Modal.css';

class Modal extends React.Component {

  static propTypes = {
    onClose: React.PropTypes.func,
    show: React.PropTypes.bool
  }

  constructor(props) {
    super(props);
  }

  render() {

    document.body.classList[this.props.show ? 'add' : 'remove']('showModal');

    return (
      <div className="Modal">
        <style>
          { this.props.show && `body { overflow: hidden; } .EventPage { filter: blur(3px); }` }
          { !this.props.show && `.TicketsConfirmed { display: none; }` }
        </style>
        <div className={`Modal-box ${this.props.className}`}>
          <div className="TitleBar">{this.props.title}</div>
          <div className="content">
            {this.props.children}
          </div>
        </div>
        <div className="Modal-overlay" onClick={this.props.onClose}></div>
      </div>
    );
  }
}

export default Modal;