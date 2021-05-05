import React from 'react';
import PropTypes from 'prop-types';
import Head from 'next/head';
import styled from 'styled-components';

import MembershipsWithData from '../components/MembershipsWithData';

const CollectivesIframeContainer = styled.div`
  body {
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    font-weight: 300;
    font-size: 1rem;
    line-height: 1.5;
    overflow-x: hidden;
  }

  a {
    text-decoration: none;
  }

  .title {
    display: flex;
    align-items: baseline;
  }

  .title .action {
    font-size: 0.8rem;
  }

  h2 {
    font-size: 20px;
    margin-right: 1rem;
    margin-bottom: 0;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  .btn {
    display: inline-block;
    padding: 6px 12px;
    margin-bottom: 0;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.42857143;
    text-align: center;
    white-space: nowrap;
    vertical-align: middle;
    touch-action: manipulation;
    cursor: pointer;
    user-select: none;
    background-image: none;
    border: 1px solid transparent;
    border-radius: 4px;
  }
  .btn-default {
    color: #333;
    background-color: #fff;
    border-color: #ccc;
  }
  .btn-default:hover {
    color: #333;
    background-color: #e6e6e6;
    border-color: #adadad;
    text-decoration: none;
    outline: 0;
  }
`;

class CollectivesIframe extends React.Component {
  static getInitialProps({ query: { collectiveSlug, id, role, orderBy, limit }, res }) {
    // Allow to be embedded as Iframe everywhere
    if (res) {
      res.removeHeader('X-Frame-Options');
    }
    return { collectiveSlug, id, role, orderBy, limit: Number(limit) };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string,
    id: PropTypes.number,
    role: PropTypes.string,
    limit: PropTypes.number,
    orderBy: PropTypes.string,
  };

  onChange = change => {
    if (!change) {
      return;
    }
    this.height = change.height;
    this.sendMessageToParentWindow();
  };

  sendMessageToParentWindow = () => {
    if (!window.parent) {
      return;
    }
    if (!this.height) {
      return;
    }
    const message = `oc-${JSON.stringify({
      id: this.props.id,
      height: this.height,
    })}`;
    window.parent.postMessage(message, '*');
  };

  render() {
    const { collectiveSlug, role, limit } = this.props;
    const orderBy = this.props.orderBy || role === 'HOST' ? 'balance' : 'totalDonations';
    return (
      <CollectivesIframeContainer>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{`${this.props.collectiveSlug} collectives`}</title>
        </Head>
        <MembershipsWithData
          onChange={this.onChange}
          memberCollectiveSlug={collectiveSlug}
          role={role}
          orderBy={orderBy}
          orderDirection="DESC"
          limit={limit || 20}
        />
      </CollectivesIframeContainer>
    );
  }
}

export default CollectivesIframe;
