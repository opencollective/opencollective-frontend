import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, FormattedDate } from 'react-intl';
import { truncate } from 'lodash';
import { Box } from '@rebass/grid';

import { Calendar } from '@styled-icons/feather/Calendar';
import { Clock } from '@styled-icons/feather/Clock';

import { ContributionTypes } from '../../lib/constants/contribution-types';
import { canOrderTicketsFromEvent } from '../../lib/events';
import { Span } from '../Text';
import Link from '../Link';
import Contribute from './Contribute';
import Container from '../Container';
import StyledLink from '../StyledLink';

const ContributeEvent = ({ collective, event, ...props }) => {
  const { startsAt, endsAt } = event;
  const description = truncate(event.description, { length: 100 });
  const isTruncated = description && description.length < event.description.length;
  const isPassed = !canOrderTicketsFromEvent(event);
  const showYearOnStartDate = endsAt ? undefined : 'numeric'; // only if there's no end date
  const eventRouteParams = { parentCollectiveSlug: collective.slug, eventSlug: event.slug };
  return (
    <Contribute
      route="event"
      routeParams={eventRouteParams}
      type={isPassed ? ContributionTypes.EVENT_PASSED : ContributionTypes.EVENT_PARTICIPATE}
      contributors={event.contributors}
      stats={event.stats.backers}
      image={event.backgroundImageUrl}
      title={
        <StyledLink as={Link} color="black.800" route="event" params={eventRouteParams}>
          {event.name}
        </StyledLink>
      }
      {...props}
    >
      {(startsAt || endsAt) && (
        <Box mb={3}>
          <Container display="flex" alignItems="center" fontSize="Caption">
            <Calendar size="1.3em" color="#C4C7CC" />
            <Span ml={2} color="black.700">
              {startsAt && <FormattedDate value={startsAt} month="short" day="numeric" year={showYearOnStartDate} />}
              {startsAt && startsAt && ' → '}
              {endsAt && <FormattedDate value={endsAt} month="short" day="numeric" year="numeric" />}
            </Span>
          </Container>
          {startsAt && (
            <Container display="flex" alignItems="center" fontSize="Caption" mt={1}>
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
        <Link route="event" params={{ parentCollectiveSlug: collective.slug, eventSlug: event.slug }}>
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
