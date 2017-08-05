import React from 'react';
import PropTypes from 'prop-types';
import Header from '../components/Header';
import Body from '../components/Body';
import Footer from '../components/Footer';
import CollectiveCover from '../components/CollectiveCover';
import OrderForm from '../components/OrderForm';
import Tier from '../components/Tier';
import NotificationBar from '../components/NotificationBar';
import Members from '../components/Members';
import { addCreateOrderMutation } from '../graphql/mutations';
import Markdown from 'react-markdown';
import { get } from 'lodash';
import { Router } from '../server/pages';

const defaultBackgroundImage = '/static/images/defaultBackgroundImage.png';

class Collective extends React.Component {

  static propTypes = {
    collective: PropTypes.object.isRequired,
    LoggedInUser: PropTypes.object
  }

  constructor(props) {
    super(props);
    this.collective = this.props.collective; // pre-loaded by SSR
    this.updateOrder = this.updateOrder.bind(this);
    this.resetOrder = this.resetOrder.bind(this);
    this.handleOrderTier = this.handleOrderTier.bind(this);

    this.state = {
      view: 'default',
      order: {},
      api: { status: 'idle' },
    };

    // testing order form
    // this.state = {"view":"OrderTier","order":{"quantity":1,"totalAmount":1000,"tier":{"id":51,"slug":"members","type":"TIER","name":"member","description":"Become a member and receive our newsletter to stay up to date with the latest initiatives happening in Brussels","amount":1000,"presets":null,"interval":"month","currency":"EUR","maxQuantity":null,"orders":[{"id":950,"publicMessage":null,"user":{"id":1648,"name":"Alaric Bouvy","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/159f8200-9d48-11e6-9116-db595ff259df.jpg","username":"alaricbouvy","twitterHandle":"Womer_Founder","description":"A young entrepreneur who wants to do his part","__typename":"User"},"__typename":"OrderType"},{"id":1023,"publicMessage":null,"user":{"id":1726,"name":"Marine Visart","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/755423e0-a121-11e6-ba30-f10557c4c678.jpg","username":"marinevisart1","twitterHandle":null,"description":"Graphic design based in brussels","__typename":"User"},"__typename":"OrderType"},{"id":1146,"publicMessage":null,"user":{"id":1861,"name":"George Kosmopoulos","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/11df58878edf48ce98883a23ef438ae5_319d1380-b195-11e6-afe2-6129fbf4c498.png","username":"georgekosmopoulos","twitterHandle":null,"description":null,"__typename":"User"},"__typename":"OrderType"},{"id":1147,"publicMessage":null,"user":{"id":1863,"name":"Raphaël Krings","image":"https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/8c07a30c-c680-457d-ab59-722be66e09d9","username":"raphaelkrings","twitterHandle":null,"description":null,"__typename":"User"},"__typename":"OrderType"},{"id":1159,"publicMessage":null,"user":{"id":1877,"name":"Philippe Drouillon","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/8733f790-b3f8-11e6-bbdc-571063972d3c.JPG","username":"philippedrouillon","twitterHandle":null,"description":null,"__typename":"User"},"__typename":"OrderType"},{"id":1163,"publicMessage":null,"user":{"id":1885,"name":"Caroline DC","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/ce8b4d40-b4a8-11e6-8e7e-5955bbcb143d.jpg","username":"cdecartier","twitterHandle":null,"description":null,"__typename":"User"},"__typename":"OrderType"},{"id":1242,"publicMessage":null,"user":{"id":1993,"name":"Laurent Hublet","image":"https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/70555f77-cb32-430b-97f6-8de45072867d","username":"laurenthublet","twitterHandle":null,"description":null,"__typename":"User"},"__typename":"OrderType"},{"id":1266,"publicMessage":null,"user":{"id":2035,"name":"Thomas Carton de Wiart","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/7e57d0b0-19ec-11e7-a996-d1ff903d60a2.jpeg","username":"thomasdewiart","twitterHandle":"barrycarton","description":null,"__typename":"User"},"__typename":"OrderType"},{"id":1412,"publicMessage":null,"user":{"id":2282,"name":"Sacha Waedemon","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/ad4f7590-c919-11e6-9af0-47fca5e686db.jpg","username":"sacha","twitterHandle":"sachawb","description":null,"__typename":"User"},"__typename":"OrderType"},{"id":1716,"publicMessage":null,"user":{"id":2911,"name":"Tarik Hennen","image":"https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/7ba10bba-b82a-425d-8c0f-4685cfc3c750","username":"tarikhennen","twitterHandle":"tarikhennen","description":null,"__typename":"User"},"__typename":"OrderType"},{"id":2076,"publicMessage":null,"user":{"id":3595,"name":"John Jadot","image":null,"username":"johnjadot","twitterHandle":"pulppp","description":null,"__typename":"User"},"__typename":"OrderType"},{"id":1625,"publicMessage":null,"user":{"id":2721,"name":"Anis Bedda","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/5e84b150-e31d-11e6-96ad-4fa0cb304f32.jpg","username":"anisbedda","twitterHandle":"anisb","description":"@transformabxl and @intrapreneurcnf cofounder, social innovation enabler, music addict, a world citizen &amp; a daddy (Alumnus Impact HUB, AIESEC) . find me at @anisb","__typename":"User"},"__typename":"OrderType"},{"id":3068,"publicMessage":null,"user":{"id":3729,"name":"Maite Morren","image":"https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/8ac96da6-8c02-4916-99b2-342bc5372b51","username":"maitemorren","twitterHandle":"MaiteMorren","description":"Brussels / politics / photography / foodie ","__typename":"User"},"__typename":"OrderType"},{"id":964,"publicMessage":null,"user":{"id":2,"name":"Xavier Damman","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/5c825534ad62223ae6a539f6a5076d3cjpeg_1699f6e0-917c-11e6-a567-3f53b7b5f95c.jpeg","username":"xdamman","twitterHandle":"xdamman","description":"Entrepreneur sharing ideas in copyleft","__typename":"User"},"__typename":"OrderType"},{"id":1037,"publicMessage":null,"user":{"id":1744,"name":"Frederik Vincx","image":"https://opencollective-production.s3-us-west-1.amazonaws.com/c6de8770-a273-11e6-9564-49520f227cc8.jpg","username":"prezly","twitterHandle":"fritsbits","description":null,"__typename":"User"},"__typename":"OrderType"}],"__typename":"Tier"}},"api":{"status":"idle"}};
    
    // To test confirmation screen, uncomment the following:
    // this.state.modal = "TicketsConfirmed";
    // this.state.order = {
    //   user: { email: "etienne@gmail.com"},
    //   tier: this.collective && this.collective.tiers[0],
    //   quantity: 2
    // };

  }

  componentDidMount() {
    window.oc = { collective: this.collective }; // for easy debugging
  }

  async createOrder(order) {
    order.tier = order.tier || {};
    const OrderInputType = {
      ... order,
      collective: { slug: this.collective.slug },
      tier: { id: order.tier.id }
    };

    this.setState( { status: 'loading' });
    try {
      await this.props.createOrder(OrderInputType);
      this.setState( { status: 'idle' });
    } catch (err) {
      console.error(">>> createOrder error: ", err);
      throw new Error(err.graphQLErrors[0].message);
    }
  }

  error(msg) {
    this.setState( {status: 'error', error: msg });
    setTimeout(() => {
      this.setState( { status: 'idle', error: null });
    }, 5000);
  }

  updateOrder(tier) {
    const order = {
      tier: { id: tier.id },
      quantity: tier.quantity,
      totalAmount: (tier.quantity || 1) * tier.amount,
      interval: tier.interval
    }
    this.setState({ order });
    window.state = this.state;
  }

  resetOrder() {
    this.setState({ order: {} });
  }

  handleOrderTier(tier) {
    this.updateOrder(tier);
    const order = this.state.order;
    order.tier = { id: tier.id };

    // If the total amount is 0 and the user is logged in, we can directly RSVP.
    if (order.totalAmount === 0 && this.props.LoggedInUser) {
      order.user = { id: this.props.LoggedInUser.id };
      return this.rsvp(order);
    }
    this.setState({ order });
    let route = `/${this.props.collective.slug}/order/${order.tier.id}`;
    if (order.totalAmount) {
      route += `/${order.totalAmount / 100}`;
    }
    if (order.interval) {
      route += `/${order.interval}`;
    }
    Router.pushRoute(route);
  }

  render() {
    console.log("CollectivePage> this.collective", this.collective, "state", this.state);

    const members = {};
    this.collective.tiers.map(tier => {
      members[tier.slug] = tier.orders.map(order => {
        return {
          totalDonations: order.totalTransactions,
          role: 'BACKER',
          member: order.fromCollective,
          createdAt: order.createdAt,
          tier,
          description: order.publicMessage
        }
      })
    });

    const backgroundImage = this.collective.backgroundImage || get(this.collective,'parentCollective.backgroundImage') || defaultBackgroundImage;

    return (
      <div>

        <div className="CollectivePage">

          <Header
            title={this.collective.name}
            description={this.collective.description || this.collective.longDescription}
            twitterHandle={this.collective.twitterHandle || get(this.collective.parentCollective, 'twitterHandle')}
            image={get(this.collective.parentCollective, 'image') || backgroundImage}
            className={this.state.status}
            LoggedInUser={this.props.LoggedInUser}
            href={`/${this.collective.slug}`}
            />

          <Body>

            <div className="CollectivePage">

              <NotificationBar status={this.state.status} error={this.state.error} />

              <CollectiveCover
                collective={this.collective}
                style={get(this.collective, 'settings.style.hero.cover') || get(this.collective.parentCollective, 'settings.style.hero.cover')}                  
                />

              <div>

                { this.state.view === 'OrderTier' &&
                  <div className="content" >              
                    <OrderForm
                      onSubmit={this.createOrder}
                      order={this.state.order}
                      LoggedInUser={this.props.LoggedInUser}
                      stripePublishableKey={this.collective.stripePublishableKey}
                      />
                  </div>
                }
                { this.state.view === 'default' &&
                  <div className="content" >
                    <div className="eventDescription" >
                      <Markdown source={this.collective.description || this.collective.longDescription} />
                    </div>

                    <div id="tiers">
                      <style jsx>{`
                        #tiers {
                          overflow: hidden
                          width: 100%;
                          display: flex;
                          flex-wrap: wrap;
                          justify-content: space-around;
                        }
                        #tiers :global(.tier) {
                          margin: 1rem;
                          max-width: 320px;
                        }
                      `}</style>
                      {this.collective.tiers.map((tier) =>
                        <Tier
                          key={tier.id}
                          className="tier"
                          tier={tier}
                          onChange={(tier) => this.updateOrder(tier)}
                          onClick={(tier) => this.handleOrderTier(tier)}
                          />
                      )}
                    </div>
                  </div>
                }
                { Object.keys(members).map(tierSlug => (
                  <section id={tierSlug}>
                    <h1>{tierSlug}</h1>
                    <Members className={tierSlug} members={members[tierSlug]} />
                  </section>
                ))}

              </div>
            </div>
          </Body>
          <Footer />
          </div>
      </div>
    )
  }
}

export default addCreateOrderMutation(Collective);
