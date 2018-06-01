import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages } from 'react-intl';
import { get } from 'lodash';

import { Router } from '../server/pages';

import Tier from '../components/Tier';
import Header from '../components/Header';
import CollectiveCover from '../components/CollectiveCover';
import Body from '../components/Body';

import { addTiersData } from '../graphql/queries';

import withData from '../lib/withData';
import withIntl from '../lib/withIntl';

class TiersPage extends React.Component {

  static getInitialProps ({ query: { collectiveSlug } }) {
    return { slug: collectiveSlug };
  }

  static propTypes = {
    slug: PropTypes.string, // for addTiersData
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object.isRequired, // from withIntl
  };

  constructor(props) {
    super(props);
    this.messages = defineMessages({
      'tiers.title': { id: 'tiers.title', defaultMessage: 'Join the collective' },
    });
  }

  handleGetTierClick = response => {
    const { Collective } = this.props.data;
    Router.pushRoute(`/${Collective.slug}/tiers/${response.tier.id}`);
  };

  updateResponse = () => {

  };

  render() {
    const { intl } = this.props;
    const { loading, Collective } = this.props.data;

    if (loading) return (<div />);

    return (
      <div>
        <style jsx>{`
          .tiers {
            margin: 0 auto;
            max-width: 400px;
          }
          .tiers :global(.tier) {
            margin: 3rem 0;
          }
        `}
        </style>
        <Header />
        <Body>
          <CollectiveCover
            href={`/${Collective.slug}`}
            logo={Collective.image}
            title={intl.formatMessage(this.messages['tiers.title'])}
            className="small"
            backgroundImage={Collective.backgroundImage}
            style={get(Collective, 'settings.style.hero.cover')}
            />
          <div className="tiers">
            {Collective.tiers.map(tier => (
              <Tier
                key={tier.id}
                className="tier"
                tier={tier}
                onChange={(response) => this.updateResponse(response)}
                onClick={(response) => this.handleGetTierClick(response)}
                />
          ))}
          </div>
        </Body>
      </div>
    );
  }
}

export default withData(withIntl(addTiersData(TiersPage)));
