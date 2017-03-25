import React from 'react'
import Head from 'next/head';
import TopBar from './TopBar';

import { truncate } from '../lib/utils';

class Header extends React.Component {

  constructor(props) {
    super(props);
    const { description, image } = props;
    const meta = {
      'twitter:site': 'opencollect',
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
    console.log(">>> description", meta.description);
  }

  render() {
    const { title, className } = this.props;
    return (
    <header>

      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://maxcdn.bootstrapcdn.com/font-awesome/latest/css/font-awesome.min.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css?family=Lato:400,700,900" rel="stylesheet" />
        <title>{title}</title>
        {this.meta.map(({name, content}) => <meta name={name} content={content} />)}
        <script type="text/javascript" src="https://js.stripe.com/v2/" />
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
        font-weight: 400;
        font-size: 14px;
        font-size: 1.4rem;
        overflow-x: hidden;
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
        text-decoration: none;
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
        font-size: 2rem;
        font-weight: bold;
      }

      .content {
        max-width: 768px;
        padding: 1rem;
        margin: 0 auto;
        line-height: 2rem;
      }

      .content > ul {
        padding-left: 3rem;
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

      input[type=text] {
        height: 42px;
        border: 1px solid rgba(48,50,51,0.2);
        border-radius: 5px;
        box-shadow: inset 0px 2px 0px rgba(0,0,0,0.05);
        padding: 5px;
        font-size: 1.8rem;
      }

      button {
        cursor: pointer;
      }

      label {
        display: inline-block;
        max-width: 100%;
        margin-bottom: 5px;
        font-weight: 700;
      }

      .row {
        display: flex;
        flex-direction: row;
      }

      `}
      </style>
      <TopBar className={className} />
    </header>
    );
  }
}

export default Header;
