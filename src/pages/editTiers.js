import React from 'react';
import { addTiersData } from '../graphql/queries';
import withData from '../lib/withData';
import withIntl from '../lib/withIntl';
import { FormattedDate, FormattedMessage } from 'react-intl';
import EditTiersComponent from '../components/EditTiers';
import Header from '../components/Header';
import Body from '../components/Body';
import Button from '../components/Button';
import { addEditTiersMutation } from '../graphql/mutations';

class EditTiers extends React.Component {

  static getInitialProps ({ query: { collectiveSlug } }) {
    return { collectiveSlug }
  }

  constructor(props) {
    super(props);

    const { Collective } = this.props.data;

    const tiers = [...Collective.tiers];
    if (tiers.length === 0) {
      tiers.push({});
    }
    this.state = { status: 'idle', tiers, result: {} };
    console.log(">>> state", this.state, "tiers", Collective.tiers);
    this.handleTiersChange = this.handleTiersChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async editTiers(TiersInputType) {
    this.setState( { status: 'loading' });
    const { Collective } = this.props.data;
    try {
      await this.props.editTiers(Collective.slug, TiersInputType );
      const tiersUrl = `${window.location.protocol}//${window.location.host}/${Collective.slug}/tiers`;
      window.location.replace(tiersUrl);
      this.setState({ result: { success: `Tiers edited successfully. (redirecting...)` }});
    } catch (err) {
      console.error(">>> editTiers error: ", JSON.stringify(err));
      const errorMsg = (err.graphQLErrors && err.graphQLErrors[0]) ? err.graphQLErrors[0].message : err.message;
      this.setState( { status: 'idle', result: { error: errorMsg }})
      throw new Error(errorMsg);
    }
  }

  handleTiersChange(tiers) {
    console.log("update tiers", tiers);
    this.setState( { tiers })
  }

  handleSubmit() {
    return this.editTiers(this.state.tiers);
  }

  render() {
    const { loading, Collective } = this.props.data;

    if (loading) return (<div />);

    return (
      <div>
        <Header />
        <Body>
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
            margin: 5rem;
          }
          `}</style>
          <div className="content">
            <EditTiersComponent
              title={`Edit tiers for ${Collective.name}`}
              tiers={this.state.tiers}
              collective={Collective}
              defaultType="BACKER"
              currency={Collective.currency}
              onChange={this.handleTiersChange}
              />
            <div className="actions">
              <Button type="submit" className="green" ref="submit" label="save" onClick={this.handleSubmit} disabled={this.state.status === 'loading'} />
              <div className="result">
                <div className="success">{this.state.result.success}</div>
                <div className="error">{this.state.result.error}</div>
              </div>
            </div>
          </div>
        </Body>
      </div>
    );
  }

}

export default withData(withIntl(addTiersData(addEditTiersMutation(EditTiers))));
