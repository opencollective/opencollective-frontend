import React, { Fragment } from 'react';
import { Clock } from '@styled-icons/feather/Clock';
import { MapPin } from '@styled-icons/feather/MapPin';
import { FormattedDate, FormattedMessage, FormattedTime } from 'react-intl';

import dayjs from '../../../lib/dayjs';

import Container from '../../Container';
import DefinedTerm, { Terms } from '../../DefinedTerm';
import { Flex } from '../../Grid';
import Link from '../../Link';
import LinkCollective from '../../LinkCollective';
import StyledLink from '../../StyledLink';
import StyledTooltip from '../../StyledTooltip';
import TruncatedTextWithTooltip from '../../TruncatedTextWithTooltip';

import HeroNote from './HeroNote';

const FormattedDateProps = (
  value: string,
  timeZone: string,
): { value: string; weekday: 'long'; day: 'numeric'; month: 'long'; year: 'numeric'; timeZone: string } => ({
  value,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone,
});

const FormattedTimeProps = (value: string, timeZone: string): { value: string; timeZone: string } => ({
  value,
  timeZone,
});

type TimerangeProps = {
  startsAt?: string;
  endsAt?: string;
  timezone: string;
  isSameDay?: boolean;
};

const Timerange = ({ startsAt, endsAt, timezone, isSameDay }: TimerangeProps) => {
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

type HeroEventDetailsProps = {
  host?: { id: number; name: string };
  displayedConnectedAccount?: { collective: { id: number; name: string; slug: string } };
  collective: {
    id: number;
    startsAt?: string;
    endsAt?: string;
    timezone?: string;
    location?: { name?: string };
    parentCollective?: { id: number; name: string; slug: string };
    isApproved?: boolean;
    isHost?: boolean;
  };
};

class HeroEventDetails extends React.Component<HeroEventDetailsProps> {
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
    const { collective, host, displayedConnectedAccount } = this.props;
    const { startsAt, endsAt, timezone, location, parentCollective } = collective;
    const parentIsHost = host && collective.parentCollective?.id === host.id;
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
                    <div {...(props as React.ComponentPropsWithRef<'div'>)}>
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

        {location?.name && (
          <HeroNote>
            <MapPin size={16} />
            <Link href="#section-location">
              <span>{location.name}</span>
            </Link>
          </HeroNote>
        )}

        {Boolean(!parentIsHost && parentCollective) && (
          <HeroNote>
            <span>
              <FormattedMessage
                id="Event.CreatedBy"
                defaultMessage="Created by: {CollectiveLink}"
                values={{
                  CollectiveLink: (
                    <Link key="collective-link" href={`/${parentCollective.slug}`}>
                      {parentCollective.name}
                    </Link>
                  ),
                }}
              />
            </span>
          </HeroNote>
        )}
        <Flex>
          {host && collective.isApproved && host.id !== collective.id && !collective.isHost && (
            <Container mr={1} color="black.700" my={2}>
              <FormattedMessage
                id="Collective.Hero.Host"
                defaultMessage="{FiscalHost}: {hostName}"
                values={{
                  FiscalHost: <DefinedTerm key="fiscal-host" term={Terms.FISCAL_HOST} color="black.700" />,
                  hostName: (
                    <StyledLink
                      key="host-name"
                      as={LinkCollective}
                      collective={host}
                      data-cy="fiscalHostName"
                      noTitle
                      color="black.700"
                    >
                      <TruncatedTextWithTooltip value={host.name} cursor="pointer" />
                    </StyledLink>
                  ),
                }}
              />
            </Container>
          )}
          {displayedConnectedAccount && (
            <Container mx={1} color="black.700" my={2}>
              <FormattedMessage
                id="Collective.Hero.ParentCollective"
                defaultMessage="Part of: {parentName}"
                values={{
                  parentName: (
                    <StyledLink
                      key="parent-name"
                      as={LinkCollective}
                      collective={displayedConnectedAccount.collective}
                      noTitle
                      color="black.700"
                    >
                      <TruncatedTextWithTooltip value={displayedConnectedAccount.collective.name} cursor="pointer" />
                    </StyledLink>
                  ),
                }}
              />
            </Container>
          )}
        </Flex>
      </Fragment>
    );
  }
}

export default HeroEventDetails;
