import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import SignInForm from '../components/SignInForm';
import EditCollectiveForm from '../components/EditCollectiveForm';
import CollectiveCover from '../components/CollectiveCover';
import { Button } from 'react-bootstrap';
import { addEditCollectiveMutation, addDeleteCollectiveMutation } from '../graphql/mutations';
import { defaultBackgroundImage } from '../constants/collectives';
import { getStripeToken, isValidCard } from '../lib/stripe';
import { defineMessages } from 'react-intl';
import withIntl from '../lib/withIntl';
import { capitalize } from '../lib/utils';
import { Router } from '../server/pages';

class EditCollective extends React.Component {

  static propTypes = {
    collective: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.editCollective = this.editCollective.bind(this);
    this.deleteCollective = this.deleteCollective.bind(this);
    this.state = { status: 'idle', result: {} };
    this.messages = defineMessages({
      'creditcard.error': { id: 'creditcard.error', defaultMessage: 'Invalid credit card' }
    });
  }

  componentDidMount() {
    window.OC = window.OC || {};
    window.OC.editCollective = this.editCollective.bind(this);
  }

  async validate(CollectiveInputType) {
    const { intl } = this.props;
    CollectiveInputType.tiers = this.cleanTiers(CollectiveInputType.tiers);
    if (!CollectiveInputType.paymentMethods) return CollectiveInputType;

    let newPaymentMethod, index;
    CollectiveInputType.paymentMethods.forEach((pm, i) => {
      if (pm.id) return;
      newPaymentMethod = pm;
      index = i;
      return;
    });

    if (!newPaymentMethod) return CollectiveInputType;

    const card = newPaymentMethod.card;
    let res;
    try {
      res = await getStripeToken('cc', card)
      const last4 = res.card.last4;
      const paymentMethod = {
        name: last4,
        token: res.token,
        monthlyLimitPerMember: newPaymentMethod.monthlyLimitPerMember,
        currency: CollectiveInputType.currency,
        data: {
          last4,
          fullName: res.card.full_name,
          expMonth: res.card.exp_month,
          expYear: res.card.exp_year,
          brand: res.card.brand,
          country: res.card.country,
          funding: res.card.funding,
          zip: res.card.address_zip
        }
      };
      CollectiveInputType.paymentMethods[index] = paymentMethod;
      return CollectiveInputType;
    } catch (e) {
      this.setState({ result: { error: `${intl.formatMessage(this.messages['creditcard.error'])}: ${e}` }})
      return false;
    }
  }

  cleanTiers(tiers) {
    if (!tiers) return null;
    return tiers.map(tier => {
      let resetAttributes = [];
      switch (tier.type) {
        case 'TICKET':
        case 'PRODUCT':
          resetAttributes = ['interval', 'presets'];
          break;
        case 'MEMBERSHIP':
        case 'SERVICE':
          resetAttributes = ['presets', 'maxQuantity'];
          break;
        case 'DONATION':
          resetAttributes = ['maxQuantity'];
          break;
      }
      const cleanTier = { ...tier };
      resetAttributes.map(attr => {
        cleanTier[attr] = null;
      })
      if (tier._amountType === 'fixed') {
        cleanTier.presets = null;
      }
      delete cleanTier._amountType;
      return cleanTier;
    })
  }

  async editCollective(CollectiveInputType) {
    CollectiveInputType = await this.validate(CollectiveInputType);
    if (!CollectiveInputType) {
      return false;
    }
    this.setState( { status: 'loading' });
    try {
      if (CollectiveInputType.backgroundImage === defaultBackgroundImage[CollectiveInputType.type]) {
        delete CollectiveInputType.backgroundImage;
      }

      const res = await this.props.editCollective(CollectiveInputType);
      const type = res.data.editCollective.type.toLowerCase();
      this.setState({ status: 'idle', result: { success: `${capitalize(type)} saved` }});
      setTimeout(() => {
        this.setState({ status: 'idle', result: { success: null }});
      }, 3000);
    } catch (err) {
      console.error(">>> editCollective error: ", JSON.stringify(err));
      const errorMsg = (err.graphQLErrors && err.graphQLErrors[0]) ? err.graphQLErrors[0].message : err.message;
      this.setState( { status: 'idle', result: { error: errorMsg }})
      throw new Error(errorMsg);
    }
  }

  async deleteCollective() {
    if (confirm("😱 Are you really sure you want to delete this collective?")) {
      this.setState( { status: 'loading' });
      try {
        await this.props.deleteCollective(this.props.collective.id);
        this.setState({ status: 'idle', result: { success: `Collective deleted successfully` }});
        const collectiveRoute = `/${this.props.collective.parentCollective.slug}`;
        Router.pushRoute(collectiveRoute);
      } catch (err) {
        console.error(">>> deleteCollective error: ", JSON.stringify(err));
        const errorMsg = (err.graphQLErrors && err.graphQLErrors[0]) ? err.graphQLErrors[0].message : err.message;
        this.setState( { result: { error: errorMsg }})
        throw new Error(errorMsg);
      }
    }
  }

  render() {

    const collective = this.props.collective || {};

    if (!collective.slug) return (<div />);

    const { LoggedInUser } = this.props;

    const title = `Edit ${collective.name} ${collective.type.toLowerCase()}`;
    const canEditCollective = LoggedInUser && LoggedInUser.canEditCollective(collective);

    return (
      <div className="EditCollective">
        <style jsx>{`
          .success {
            color: green;
          }
          .error {
            color: red;
          }
          .login {
            text-align: center;
          }
          .actions {
            text-align: center;
            margin-bottom: 5rem;
          }
        `}</style>
        
        <Header
          title={collective.name}
          description={collective.description}
          twitterHandle={collective.twitterHandle}
          image={collective.image || collective.backgroundImage}
          className={this.state.status}
          LoggedInUser={this.props.LoggedInUser}
          />

        <Body>

          <CollectiveCover
            href={`/${collective.slug}`}
            collective={collective}
            title={title}
            className="small"
            />

          <div className="content" >
            {!canEditCollective &&
              <div className="login">
                <p>You need to be logged in as the creator of this collective<br />or as a core contributor of the {collective.name} collective.</p>
                <SignInForm next={`/${collective.slug}/edit`} />
              </div>
            }   
            { canEditCollective &&
              <div>
                <EditCollectiveForm collective={collective} onSubmit={this.editCollective} loading={this.state.status === 'loading'} />
                <div className="actions">
                  { collective.type === 'EVENT' && (<a onClick={this.deleteCollective}>delete event</a>)}
                  <div className="result">
                    <div className="success">{this.state.result.success}</div>
                    <div className="error">{this.state.result.error}</div>
                  </div>
                </div>
              </div>
            }
          </div>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default addEditCollectiveMutation(addDeleteCollectiveMutation(withIntl(EditCollective)));