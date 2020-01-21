import React from 'react';
import PropTypes from 'prop-types';

class Modal extends React.Component {
  static propTypes = {
    onClose: PropTypes.func,
    show: PropTypes.bool,
    className: PropTypes.string,
    title: PropTypes.string,
    children: PropTypes.node,
  };

  constructor(props) {
    super(props);
  }

  render() {
    if (typeof document !== 'undefined') {
      document.body.classList[this.props.show ? 'add' : 'remove']('showModal');
    }

    const style = {
      display: this.props.show ? 'block' : 'none',
    };

    return (
      <div className="Modal" style={style}>
        <style jsx>
          {`
            .Modal-overlay {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.6);
              z-index: 90;
              display: none;
            }

            .Modal-box {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: white;
              width: 500px;
              max-width: 100%;
              height: 450px;
              max-height: 100%;
              border-radius: 10px;
              z-index: 100;
            }

            .Modal-box .TitleBar {
              position: absolute;
              top: 0;
              font-size: 1.8rem;
              line-height: 40px;
              height: 40px;
              color: white;
              background: rgba(50, 50, 50, 0.9);
              width: 100%;
              text-align: center;
              z-index: 100;
            }

            .Modal-box > .content {
              position: relative;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              flex-direction: column;
            }

            @media (max-width: 500px) {
              .Modal-box {
                position: absolute;
                top: 0;
                left: 0;
                transform: none;
              }
              .Modal-overlay {
                background: white;
              }
            }

            .confirm-ArchiveCollective,
            .confirm-deleteCollective {
              height: 130px;
            }
          `}
        </style>
        <div className={`Modal-box ${this.props.className}`}>
          <div className="TitleBar">{this.props.title}</div>
          <div className="content">{this.props.children}</div>
        </div>
        <div className="Modal-overlay" onClick={this.props.onClose} style={style} />
      </div>
    );
  }
}

export default Modal;
