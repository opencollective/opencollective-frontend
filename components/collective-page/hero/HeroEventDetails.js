import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Clock } from '@styled-icons/feather/Clock';
import { MapPin } from '@styled-icons/feather/MapPin';
import NextLink from 'next/link';
import { FormattedDate, FormattedMessage, FormattedTime } from 'react-intl';

import dayjs from '../../../lib/dayjs';

import StyledTooltip from '../../StyledTooltip';

import HeroNote from './HeroNote';

const FormattedDateProps = (value, timeZone) => ({
  value,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone,
});

const FormattedTimeProps = (value, timeZone) => ({
  value,
  timeZone,
});

const Timerange = ({ startsAt, endsAt, timezone, isSameDay }) => {
  return (
    <Fragment>
      <FormattedDate {...FormattedDateProps(startsAt, timezone)} />
      , <FormattedTime {...FormattedTimeProps(startsAt, timezone)} />{' '}
      {endsAt && (
        <Fragment>
          -{' '}
          {!isSameDay && (
            <Fragment>
              <FormattedDate {...FormattedDateProps(endsAt, timezone)} />,{' '}
            </Fragment>
          )}
          <FormattedTime {...FormattedTimeProps(endsAt, timezone)} />{' '}
        </Fragment>
      )}
      (UTC{dayjs().tz(timezone).format('Z')})
    </Fragment>
  );
};

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
      const eventTimezone = dayjs().tz(this.props.collective.timezone).format('Z');
      const browserTimezone = dayjs().tz(dayjs.tz.guess()).format('Z');
      return eventTimezone !== browserTimezone;
    }
  }

  isSameDay(startsAt, endsAt, timezone) {
    if (!endsAt) {
      return true;
    }
    const tzStartsAt = dayjs.tz(new Date(startsAt), timezone);
    const tzEndsAt = dayjs.tz(new Date(endsAt), timezone);
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
          <HeroNote>
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
                        timezone={dayjs.tz.guess()}
                        isSameDay={this.isSameDay(startsAt, endsAt, dayjs.tz.guess())}
                      />{' '}
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
          </HeroNote>
        )}

        {location.name && (
          <HeroNote>
            <MapPin size={16} />
            <NextLink href={locationRoute}>
              <span>{location.name}</span>
            </NextLink>
          </HeroNote>
        )}

        {parentCollective && (
          <HeroNote>
            <span>
              <FormattedMessage
                id="Event.CreatedBy"
                defaultMessage="Created by: {CollectiveLink}"
                values={{
                  CollectiveLink: <NextLink href={`/${parentCollective.slug}`}>{parentCollective.name}</NextLink>,
                }}
              />
            </span>
          </HeroNote>
        )}
      </Fragment>
    );
  }
}

export default HeroEventDetails;
