import React from 'react';
import I18nCollectiveTags from '../I18nCollectiveTags';
import 'jest-styled-components';
import { snapshotI18n } from '../../test/snapshot-helpers';

describe('I18nCollectiveTags', () => {
  it('renders a single tag', () => {
    snapshotI18n(<I18nCollectiveTags tags="open source" />);
    snapshotI18n(<I18nCollectiveTags tags="not translated" />);
  });

  it('renders a list of tag', () => {
    snapshotI18n(<I18nCollectiveTags tags={['open source']} />);
    snapshotI18n(<I18nCollectiveTags tags={['not translated', 'open source', 'Meetup']} />);
  });

  it('can ignore untranslated', () => {
    snapshotI18n(<I18nCollectiveTags tags={['not translated', 'open source', 'Meetup']} ignoreUntranslated />);
  });

  it('can provide a custom renderer', () => {
    snapshotI18n(
      <I18nCollectiveTags tags={['HelloWorld', 'Meetup']}>
        {tags =>
          tags.map(({ value, isTranslated }) => (
            <div key={value}>
              {value} is {isTranslated ? 'translated' : 'untranslated'}
            </div>
          ))
        }
      </I18nCollectiveTags>,
    );
  });
});
