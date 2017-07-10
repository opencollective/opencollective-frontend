import React from 'react'
import Head from 'next/head';
import TopBar from './TopBar';

import { truncate } from '../lib/utils';

class Header extends React.Component {

  constructor(props) {
    super(props);
    const { description, image, twitterHandle } = props;
    const meta = {
      'twitter:site': 'opencollect',
      'twitter:creator': twitterHandle, 
      'fb:app_id': '266835577107099',
      'og:image': image,
      'description': truncate(description, 256)
    };

    this.meta = [];
    for (const name in meta) {
      this.meta.push({
        name,
        content: meta[name]
      })
    }
  }

  render() {
    const { title, className } = this.props;
    return (
    <header>

      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/latest/css/font-awesome.min.css" />
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/latest/css/bootstrap.min.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Lato:400,700,900" />
        <title>{title}</title>
        {this.meta.map(({name, content}) => <meta property={name} content={content} />)}
      </Head>

      <style jsx global>{`
      @font-face {
        font-family: 'montserratlight';
        src: url('/static/fonts/montserrat/montserrat-light-webfont.eot');
        src: url('/static/fonts/montserrat/montserrat-light-webfont.eot?#iefix') format('embedded-opentype'),
          url('/static/fonts/montserrat/montserrat-light-webfont.woff2') format('woff2'),
          url('/static/fonts/montserrat/montserrat-light-webfont.woff') format('woff'),
          url('/static/fonts/montserrat/montserrat-light-webfont.ttf') format('truetype'),
          url('/static/fonts/montserrat/montserrat-light-webfont.svg#montserratlight') format('svg');
        font-weight: normal;
        font-style: normal;
      }
      @font-face {
        font-family: 'lato';
        src: url('/static/fonts/montserrat/lato-regular.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }

      html {
        font-size: 62.5%;
        height: 100%;
        width: 100%;
      }

      body {
        width: 100%;
        height: 100%;
        padding: 0;
        margin: 0;
        font-family: Lato,Helvetica,sans-serif;
        font-weight: 300;
        font-size: 1.6rem;
        line-height: 1.5;
        overflow-x: hidden;
      }

      body.showModal {
        overflow: hidden;
      }
      body.showModal .EventPage {
        filter: blur(3px); background: rgba(0,0,0,0.6);
      }

      body > div:first-child {
        position: relative;
        min-height: 100%;
      }

      @media(max-width: 600px) {
        html {
          font-size: 55%;
        }
      }

      #root {
        height: 100%;
      }

      .EventPage {
        position: relative;
        height: 100%;
      }

      @media(max-width: 600px) {
        .showModal .EventPage {
          display: none;
        }
      }

      a {
        text-decoration: none !important;
        cursor: pointer;
      }

      section {
        margin: 3rem 0px;
        overflow: hidden;
      }

      h1, h2, h3, h4 {
        font-family: 'montserratlight';
      }

      h1 {
        text-align: center;
        margin: 40px 0px 20px;
        font-size: 1.8rem;
        font-weight: bold;
      }

      .content {
        max-width: 768px;
        padding: 1rem;
        margin: 0 auto;
        line-height: 1.5;
      }

      .content h2 {
        font-size: 1.8rem;
      }

      .content h3 {
        font-size: 1.7rem;
      }

      .content > ul {
        padding-left: 3rem;
      }

      .content img {
        max-width: 100%;
      }

      .content code {
        background-color: #f6f8fa;
        padding: 0.5rem;
        overflow: scroll;
        max-width: 100%;
      }

      .content code:first-child:last-child {
        display: inline-block;
        padding: 1rem;
      }

      .getTicketForm {
        margin: 20px auto;
        max-width: 400px;
      }

      .map {
        border: 1px solid #eee;
        height: 300px;
        position: relative;
      }

      .map-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0);
      }

      .tier {
        margin: 40px auto;
      }

      button {
        cursor: pointer;
      }

      .row {
        display: flex;
        flex-direction: row;
      }

      @media(max-width: 600px) {
        .desktopOnly {
          display: none !important;
        }
      }
      #media(max-width: 400px) {
        .mediumScreenOnly {
          display: none !important;
        }
      }

      `}
      </style>
      <TopBar className={className} LoggedInUser={this.props.LoggedInUser} />
    </header>
    );
  }
}

export default Header;
