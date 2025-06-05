import React from 'react';
import { defineMessages, injectIntl } from 'react-intl';

import { CollectiveCategory } from '../lib/constants/collectives';

const TranslatedTags = defineMessages({
  [CollectiveCategory.ASSOCIATION]: {
    id: 'collective.category.association',
    defaultMessage: 'Association',
  },
  [CollectiveCategory.COLLECTIVE]: {
    id: 'Collective',
    defaultMessage: 'Collective',
  },
  [CollectiveCategory.CONFERENCE]: {
    id: 'Tags.CONFERENCE',
    defaultMessage: 'Conference',
  },
  [CollectiveCategory.COOPERATIVE]: {
    id: 'collective.category.coop',
    defaultMessage: 'Cooperative',
  },
  [CollectiveCategory.OPEN_SOURCE]: {
    id: 'Tags.OPEN_SOURCE',
    defaultMessage: 'Open source',
  },
  [CollectiveCategory.MEDIA]: {
    id: 'Tags.MEDIA',
    defaultMessage: 'Media',
  },
  [CollectiveCategory.MEETUP]: {
    id: 'collective.category.meetup',
    defaultMessage: 'Meetup',
  },
  [CollectiveCategory.MOVEMENT]: {
    id: 'collective.category.movement',
    defaultMessage: 'Movement',
  },
  [CollectiveCategory.POLITICS]: {
    id: 'Tags.POLITICS',
    defaultMessage: 'Politics',
  },
  [CollectiveCategory.TECH_MEETUP]: {
    id: 'Tags.TECH_MEETUP',
    defaultMessage: 'Tech meetup',
  },
  [CollectiveCategory.US_NONPROFIT]: {
    id: 'Tags.US_NONPROFIT',
    defaultMessage: 'US nonprofit',
  },
  [CollectiveCategory.EVENT]: {
    id: 'ContributionType.Event',
    defaultMessage: 'Event',
  },
  [CollectiveCategory.USER]: {
    id: 'Tags.USER',
    defaultMessage: 'User',
  },
  [CollectiveCategory.ORGANIZATION]: {
    id: 'Tags.ORGANIZATION',
    defaultMessage: 'Organization',
  },
  [CollectiveCategory.FUND]: {
    id: 'Tags.FUND',
    defaultMessage: 'Fund',
  },
  [CollectiveCategory.PROJECT]: {
    id: 'ContributionType.Project',
    defaultMessage: 'Project',
  },
});

/** Translates a list of tags */
class I18nCollectiveTags extends React.Component {
  static defaultProps = {
    ignoreUntranslated: false,
    /** Default renderer, will render a string list */
    children: tags => {
      return tags.map((tag, index, translatedTags) => {
        if (index === translatedTags.length - 1) {
          return tag.value;
        } else {
          return `${tag.value}, `;
        }
      });
    },
  };

  render() {
    const { intl, children, tags, ignoreUntranslated } = this.props;
    const tagsToTranslate = typeof tags === 'string' ? [tags] : tags;
    const processedTags = tagsToTranslate.map(tag => {
      if (TranslatedTags[tag]) {
        return { value: intl.formatMessage(TranslatedTags[tag]), isTranslated: true };
      } else {
        return { value: tag, isTranslated: false };
      }
    });

    return children(ignoreUntranslated ? processedTags.filter(t => t.isTranslated) : processedTags);
  }
}

export default injectIntl(I18nCollectiveTags);
