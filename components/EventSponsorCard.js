import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, FormattedDate } from 'react-intl';
import { get } from 'lodash';

import { getCollectiveImage } from '../lib/image-utils';

const EventSponsorCard = ({ sponsor }) => (
  <a href={`/${sponsor.slug}`}>
    <div className="EventSponsorCard">
      <style jsx>
        {`
          .EventSponsorCard {
            display: inline-block;
            cursor: pointer;
            width: 12rem;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(46, 77, 97, 0.2);
            text-align: center;
            padding-top: 2rem;
            margin: 1rem;
            background: white;
          }
          .EventSponsorCard:hover {
            box-shadow: 0 1px 5px rgba(46, 77, 97, 0.4);
          }
          .EventSponsorCard.sponsor {
            width: 17.5rem;
          }
          img {
            max-width: 10rem;
            max-height: 5rem;
            margin-bottom: 0.5rem;
          }
          .tier {
            padding: 1rem 0.5rem;
            margin: 0;
            min-height: 27px;
            border-top: 1px solid #dde1e4;
            overflow: hidden;
          }
          .name {
            color: #7fadf2;
            font-size: 1.2rem;
          }
          .tier .name {
            font-size: 1rem;
            font-weight: 700;
            text-transform: uppercase;
            color: #75cc1f;
            white-space: nowrap;
            text-overflow: ellipsis;
            letter-spacing: 1.47px;
            margin-bottom: 0.3rem;
          }
          .tier .since {
            font-size: 1rem;
            letter-spacing: 0.05rem;
            opacity: 0.5;
            margin: 0;
          }
        `}
      </style>
      <img className="logo" src={getCollectiveImage(sponsor, { name: 'logo' })} />
      <p className="name">{sponsor.name}</p>
      <div className="tier border-top border-gray px3 py2">
        <p className="name">{get(sponsor, 'tier.name')}</p>
        <p className="since">
          <FormattedMessage
            id="membership.since"
            defaultMessage="since {date}"
            values={{ date: <FormattedDate value={sponsor.createdAt} month="long" year="numeric" /> }}
          />
        </p>
      </div>
    </div>
  </a>
);

EventSponsorCard.propTypes = {
  sponsor: PropTypes.object,
};

export default EventSponsorCard;
