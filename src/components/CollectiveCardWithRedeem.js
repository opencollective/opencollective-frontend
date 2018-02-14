import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, FormattedDate } from 'react-intl';
import Currency from './Currency';
import { pickLogo } from '../lib/collective.lib';
import { get } from 'lodash';
import { Router, Link } from '../server/pages';
import { firstSentence, imagePreview } from '../lib/utils';
import { defaultBackgroundImage } from '../constants/collectives';
import colors from '../constants/colors';
import Button from './Button';
import InputField from './InputField';

class CollectiveCardWithRedeem extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
  }


  render() {
    const { collective, onClick } = this.props;
    const currency = collective.currency;
    const logo = imagePreview(collective.image, pickLogo(collective.id), { height: 128 });

    const coverStyle = { ...get(collective, 'settings.style.hero.cover')};
    const backgroundImage = imagePreview(collective.backgroundImage, collective.type === 'COLLECTIVE' && defaultBackgroundImage[collective.type], { width: 400 });
    if (!coverStyle.backgroundImage && backgroundImage) {
      coverStyle.backgroundImage = `url('${backgroundImage}')`;
      coverStyle.backgroundSize = 'cover';
      coverStyle.backgroundPosition = 'center center';
    }

    const description = (collective.description && firstSentence(collective.description, 64)) ||(collective.longDescription && firstSentence(collective.longDescription, 64))

    return (
        <div className={`CollectiveCard ${collective.type}`} >
          <style jsx>{`
          .CollectiveCard {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            cursor: pointer;
            vertical-align: top;
            position: relative;
            box-sizing: border-box;
            width: 225px;
            border-radius: 10px;
            background-color: #ffffff;
            box-shadow: 0 1px 3px 0 rgba(45, 77, 97, 0.2);
            overflow: hidden;
            text-decoration: none !important;
            margin: 1rem 2rem 1rem 0;
          }

          .head {
            position: relative;
            overflow: hidden;
            width: 100%;
            height: 12rem;
            border-bottom: 5px solid #46b0ed;
          }

          .background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-size: cover;
            background-position: center;
          }

          .image {
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            width: 65%;
            height: 55%;
            margin: auto;
          }

          .body {
            padding: 1rem;
            min-height: 10rem;
          }
        
          .name, .description {
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .name {
            min-height: 20px;
            font-size: 14px;
            margin: 5px;
            font-family: lato;
            font-weight: 300;
            text-align: center;
            color: #303233;
            white-space: nowrap;
          }

          .description {
            font-family: lato;
            font-weight: normal;
            text-align: center;
            color: #787d80;
            font-size: 1.2rem;
            line-height: 1.3;
            margin: 0 5px;
          }

          .footer {
            font-size: 1.1rem;
            width: 100%;
            min-height: 6rem;
            text-align: center;
          }

          .stats, .redeem {
            border-top: 1px solid #f2f2f2;
            padding: 1rem;
            color: #303233;
          }

          .stats {
            display: flex;
            width: 100%;
            height: 6rem;
            justify-content: space-around;
          }

          .value, .label {
            text-align: center;
            margin: auto;
          }

          .value {
            font-family: Lato;
            font-weight: normal;
            text-align: center;
            color: #303233;
            font-size: 1.4rem;
            margin: 3px 2px 0px;
          }

          .label {
            font-family: Lato;
            font-size: 9px;
            text-align: center;
            font-weight: 300;
            color: #a8afb3;
            text-transform: uppercase;
          }

          .redeem {
            min-height: 18px;
            font-family: Lato;
            font-size: 12px;
            font-weight: 500;
            line-height: 1.5;
            text-align: center;
            color: #aab0b3;
            text-transform: capitalize;
            padding: 10px 0px;
          }
          `}</style>
        
        <Link 
          route={'donate'}
          params={{ 
            collectiveSlug: this.props.collective.slug,
            verb: 'donate',
            description: 'Gift card',
            amount: 50,
            redeem: true
            }}
          >
          <div>

            <div className='head'>
              <div className='background' style={coverStyle}></div>
              <div className='image' style={{backgroundImage: `url(${logo})`}}></div>
            </div>
            <div className='body'>
              <div className='name'>{collective.name}</div>
              <div className='description'>{description}</div>
            </div>
            <div className='footer'>
              { collective.stats &&
                <div className="stats">
                  <div className="backers">
                    <div className="value">{collective.stats.backers.users}</div>
                    <div className="label">
                      <FormattedMessage
                        id="collective.stats.backers.users"
                        values={{ n: collective.stats.backers.users }}
                        />
                    </div>
                  </div>
                  <div className="organizations">
                    <div className="value">{collective.stats.backers.organizations}</div>
                    <div className="label">
                      <FormattedMessage
                        id="collective.stats.backers.organizations"
                        values={{ n: collective.stats.backers.organizations }}
                        />
                    </div>
                  </div>
                </div>
              }
            </div>
            <div className='redeem'>
              <Button className='redeem-button blue' style={{width: '150px', height: '3rem', textAlign: 'center', letterSpacing: '0px', textTransform: 'none', borderRadius: '16px'}} >Support us!</Button>
            </div>
          </div>
        </Link>
      </div>
      );
  }
}

export default CollectiveCardWithRedeem;