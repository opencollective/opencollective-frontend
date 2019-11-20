import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import moment from 'moment';
import momentTimezone from 'moment-timezone';
import { FormattedMessage, FormattedDate, FormattedTime } from 'react-intl';
import themeGet from '@styled-system/theme-get';
import { MapPin } from 'styled-icons/feather/MapPin';
import { Clock } from 'styled-icons/feather/Clock';

import StyledTooltip from '../../StyledTooltip';
import Link from '../../Link';

const StyledEventNote = styled.div`
  display: flex;
  align-items: center;
  margin: 5px 0;
  font-size: 16px;
  svg {
    flex: 0 0 auto;
    margin-right: 6px;
  }
  a {
    color: #333;
    &:focus {
      color: ${themeGet('colors.primary.700')};
      text-decoration: none;
    }

    &:hover {
      color: ${themeGet('colors.primary.400')};
      text-decoration: none;
    }
  }
`;

const Timerange = ({ startsAt, endsAt, timezone, isSameDay }) => (
  <Fragment>
    <FormattedDate value={startsAt} timeZone={timezone} weekday="short" day="numeric" month="long" year="numeric" />
    , <FormattedTime value={startsAt} timeZone={timezone} />{' '}
    {endsAt && (
      <Fragment>
        -{' '}
        {!isSameDay && (
          <Fragment>
            <FormattedDate
              value={endsAt}
              timeZone={timezone}
              weekday="short"
              day="numeric"
              month="long"
              year="numeric"
            />
            ,{' '}
          </Fragment>
        )}
        <FormattedTime value={endsAt} timeZone={timezone} />{' '}
      </Fragment>
    )}
    {moment()
      .tz(timezone)
      .zoneAbbr()}
  </Fragment>
);

Timerange.propTypes = {
  startsAt: PropTypes.string,
  endsAt: PropTypes.string,
  timezone: PropTypes.string.isRequired,
  isSameDay: PropTypes.bool,
};

class HeroEventDetails extends React.Component {
  static propTypes = {
    collective: PropTypes.shape({
      startsAt: PropTypes.string,
      endsAt: PropTypes.string,
      timezone: PropTypes.string.isRequired,
      location: PropTypes.object,
      parentCollective: PropTypes.object,
    }).isRequired,
  };

  isNotLocalTimeZone() {
    if (this.props.collective.timezone) {
      const eventTimezone = moment()
        .tz(this.props.collective.timezone)
        .format('Z');
      const browserTimezone = moment()
        .tz(momentTimezone.tz.guess())
        .format('Z');
      return eventTimezone !== browserTimezone;
    }
  }

  isSameDay(startsAt, endsAt, timezone) {
    if (!endsAt) return true;
    const tzStartsAt = moment.tz(new Date(startsAt), timezone);
    const tzEndsAt = moment.tz(new Date(endsAt), timezone);
    return tzStartsAt.isSame(tzEndsAt, 'day');
  }

  render() {
    const {
      collective: { startsAt, endsAt, timezone, location, parentCollective },
    } = this.props;

    const locationRoute = '#section-location';

    return (
      <Fragment>
        {startsAt && (
          <StyledEventNote>
            <Clock size={16} />
            {this.isNotLocalTimeZone() ? (
              <Fragment>
                <StyledTooltip
                  place="bottom"
                  content={() => (
                    <Fragment>
                      <Timerange
                        startsAt={startsAt}
                        endsAt={endsAt}
                        timezone={moment.tz.guess()}
                        isSameDay={this.isSameDay(startsAt, endsAt, moment.tz.guess())}
                      />
                      (<FormattedMessage id="EventCover.LocalTime" defaultMessage="Your Time" />)
                    </Fragment>
                  )}
                >
                  {props => (
                    <div {...props}>
                      <Timerange
                        startsAt={startsAt}
                        endsAt={endsAt}
                        timezone={timezone}
                        isSameDay={this.isSameDay(startsAt, endsAt, timezone)}
                      />
                    </div>
                  )}
                </StyledTooltip>
              </Fragment>
            ) : (
              <Timerange
                startsAt={startsAt}
                endsAt={endsAt}
                timezone={timezone}
                isSameDay={this.isSameDay(startsAt, endsAt, timezone)}
              />
            )}
          </StyledEventNote>
        )}

        {location.name && (
          <StyledEventNote>
            <MapPin size={16} />
            <Link route={locationRoute}>
              <span>{location.name}</span>
            </Link>
          </StyledEventNote>
        )}

        <StyledEventNote>
          <span>
            <FormattedMessage
              id="Event.CreatedBy"
              defaultMessage="Created by: {CollectiveLink}"
              values={{
                CollectiveLink: <Link route={`/${parentCollective.slug}`}>{parentCollective.name}</Link>,
              }}
            />
          </span>
        </StyledEventNote>
      </Fragment>
    );
  }
}

export default HeroEventDetails;
