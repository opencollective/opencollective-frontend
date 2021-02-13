import React from 'react';
import PropTypes from 'prop-types';
import { Calendar } from '@styled-icons/feather/Calendar';
import { Clock } from '@styled-icons/feather/Clock';
import { truncate } from 'lodash';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { ContributionTypes } from '../../lib/constants/contribution-types';
import DayJs from '../../lib/dayjs';
import { canOrderTicketsFromEvent, isPastEvent } from '../../lib/events';

import Container from '../Container';
import { Box } from '../Grid';
import Link from '../Link';
import StyledLink from '../StyledLink';
import { Span } from '../Text';

import Contribute from './Contribute';

const ContributeEvent = ({ collective, event, ...props }) => {
  const { startsAt, endsAt } = event;
  const description = truncate(event.description, { length: 100 });
  const isTruncated = description && description.length < event.description.length;
  const isPassed = isPastEvent(event);
  const canOrderTickets = canOrderTicketsFromEvent(event);
  const takesMultipleDays = startsAt && endsAt && !DayJs(startsAt).isSame(endsAt, 'day');
  const showYearOnStartDate = !endsAt || !takesMultipleDays ? 'numeric' : undefined; // only if there's no end date

  return (
    <Contribute
      route={`${collective.slug}/events/${event.slug}`}
      type={isPassed ? ContributionTypes.EVENT_PASSED : ContributionTypes.EVENT_PARTICIPATE}
      disableCTA={!isPassed && !canOrderTickets}
      contributors={event.contributors}
      stats={event.stats.backers}
      image={event.backgroundImageUrl}
      title={
        <StyledLink as={Link} color="black.800" href={`${collective.slug}/events/${event.slug}`}>
          {event.name}
        </StyledLink>
      }
      {...props}
    >
      {(startsAt || endsAt) && (
        <Box mb={3}>
          <Container display="flex" alignItems="center" fontSize="12px">
            <Calendar size="1.3em" color="#C4C7CC" />
            <Span ml={2} color="black.700">
              {startsAt && (
                <time dateTime={startsAt}>
                  <FormattedDate value={startsAt} month="short" day="numeric" year={showYearOnStartDate} />
                </time>
              )}
              {takesMultipleDays && ' → '}
              {(takesMultipleDays || (!startsAt && endsAt)) && (
                <time dateTime={endsAt}>
                  <FormattedDate value={endsAt} month="short" day="numeric" year="numeric" />
                </time>
              )}
            </Span>
          </Container>
          {startsAt && (
            <Container display="flex" alignItems="center" fontSize="12px" mt={1}>
              <Clock size="1.3em" color="#C4C7CC" />
              <Span ml={2} color="black.700">
                <FormattedDate value={startsAt} hour="2-digit" minute="2-digit" timeZoneName="short" />
              </Span>
            </Container>
          )}
        </Box>
      )}
      {description}
      {isTruncated && (
        <Link href={`${collective.slug}/events/${event.slug}`}>
          <Span textTransform="capitalize" whiteSpace="nowrap">
            <FormattedMessage id="ContributeCard.ReadMore" defaultMessage="Read more" />
          </Span>
        </Link>
      )}
    </Contribute>
  );
};

ContributeEvent.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
  }),
  event: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    backgroundImageUrl: PropTypes.string,
    startsAt: PropTypes.string,
    endsAt: PropTypes.string,
    description: PropTypes.string,
    contributors: PropTypes.arrayOf(PropTypes.object),
    stats: PropTypes.shape({
      backers: PropTypes.object,
    }).isRequired,
  }),
};

export default ContributeEvent;
