import React from 'react';
import PropTypes from 'prop-types';
import colors from '../constants/colors';
import { Router } from '../server/pages';

import { defineMessages, injectIntl, FormattedMessage, FormattedDate } from 'react-intl';
import { pickAvatar } from '../lib/collective.lib';
import { firstSentence, singular, capitalize } from '../lib/utils';
import CollectiveCard from './CollectiveCard';

const star = '/static/images/icons/star.svg';


class Member extends React.Component {

  static propTypes = {
    member: PropTypes.object.isRequired
  }

  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);

    this.messages = defineMessages({
      INTERESTED: { id: 'member.status.interested', defaultMessage: '{name} is interested' },
      YES: { id: 'member.status.yes', defaultMessage: '{name} is going' }
    });

  }

  onClick() {
    Router.pushRoute(`/${this.props.member.member.slug}`);    
  }

  render() {
    const membership = this.props.member;
    const { member, description } = membership;

    const user = member.user || {};
    const name = ((member.name && member.name.match(/^null/)) ? null : member.name) || member.slug || user.email && user.email.substr(0, user.email.indexOf('@'));

    if (!name) return (<div/>);

    const image = member.image || pickAvatar(name);
    const title = member.description;
    const className = this.props.className;

    return (
      <div className={`Member ${className}`}>
        <style jsx>{`
        .Member {
          width: 100%;
          margin: 10px;
          max-width: 300px;
          float: left;
          position: relative;
        }

        .Member.sponsors {
          width: 200px;
        }
        
        .avatar {
          float: left;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          margin-top: 1rem;
          background-repeat: no-repeat;
          background-position: center center;
          background-size: cover;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px #75cc1f;
        }

        .bubble {
            padding: 1rem;
            overflow: hidden;
        }

        .name {
            font-family: 'montserratlight';
            font-size: 1.7rem;
        }

        .description, .since {
          font-family: 'lato';
          font-size: 1.4rem;
        }

        .star {
          width: 14px;
          height: 14px;
          position: absolute;
          top: 45px;
          left: 0;
        }
        `}</style>          
        <div>
          { className !== 'sponsors' &&
            <a onClick={this.onClick} title={title}>
              <div className="avatar" style={{ backgroundImage: `url(${image})`} } />
              <div className="bubble">
                <div className="name">{name}</div>
                <div className="description" style={{color: colors.darkgray}}>{firstSentence(description || member.description, 64)}</div>
                <div className="since" style={{color: colors.darkgray}}>
                  {capitalize(singular(membership.tier.name))} &nbsp;
                  <FormattedMessage id='membership.since' defaultMessage={`since`} />&nbsp;
                  <FormattedDate value={membership.createdAt} month='long' year='numeric' />
                </div>
              </div>
            </a>
          }
          { className === 'sponsors' &&
            <CollectiveCard collective={member} membership={membership} />
          }
        </div>
      </div>
    )
  }

}

export default injectIntl(Member);