import React from 'react';
import PropTypes from 'prop-types';
import Geosuggest from 'react-geosuggest';
import Location from './Location';

class InputTypeLocation extends React.Component {

  static propTypes = {
    value: PropTypes.object,
    className: PropTypes.string,
    onChange: PropTypes.func.required
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = { value: props.value || {} };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value != this.props.value) {
      this.setState({value: nextProps.value});
    }
  }

  handleChange(value) {
    const label = value.label && value.label.replace(/,.+/,'');
    const location = {
      name: label,
      address: value.gmaps.formatted_address,
      lat: value.location.lat,
      long: value.location.lng
    };
    this.setState({value: location});
    return this.props.onChange(location);    
  }

  render() {
    return (
      <div className="InputTypeLocation" className={this.props.className}>
        <style jsx global>{`
        .geosuggest {
          font-size: 18px;
          font-size: 1rem;
          position: relative;
          text-align: left;
        }
        .geosuggest__input {
          display: block;
          width: 100%;
          height: 34px;
          padding: 6px 12px;
          font-size: 14px;
          line-height: 1.42857143;
          color: #555;
          background-color: #fff;
          background-image: none;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .geosuggest__input:focus {
          border-color: #267dc0;
          box-shadow: 0 0 0 transparent;
        }
        .geosuggest__suggests {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          max-height: 25em;
          padding: 0;
          margin-top: -1px;
          background: #fff;
          border: 2px solid #267dc0;
          border-top-width: 0;
          overflow-x: hidden;
          overflow-y: auto;
          list-style: none;
          z-index: 5;
          -webkit-transition: max-height 0.2s, border 0.2s;
                  transition: max-height 0.2s, border 0.2s;
        }
        .geosuggest__suggests--hidden {
          max-height: 0;
          overflow: hidden;
          border-width: 0;
        }

        /**
        * A geosuggest item
        */
        .geosuggest__item {
          font-size: 18px;
          font-size: 1rem;
          padding: .5em .65em;
          cursor: pointer;
        }
        .geosuggest__item:hover,
        .geosuggest__item:focus {
          background: #f5f5f5;
        }
        .geosuggest__item--active {
          background: #267dc0;
          color: #fff;
        }
        .geosuggest__item--active:hover,
        .geosuggest__item--active:focus {
          background: #ccc;
        }
        `}</style>
        <Geosuggest onSuggestSelect={event => this.handleChange(event)} />
        <Location location={this.state.value} showTitle={false} />
      </div>
    );
  }
}

export default InputTypeLocation;