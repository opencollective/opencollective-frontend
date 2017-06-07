import React from 'react'
import { addAttendeesData } from '../graphql/queries';
import withData from '../lib/withData';
import { capitalize, firstSentence } from '../lib/utils';
import colors from '../constants/colors';

class Nametags extends React.Component {

  static getInitialProps ({ query: { collectiveSlug, eventSlug } }) {
    return { collectiveSlug, eventSlug }
  }

  constructor(props) {
    super(props);
    this.dimensions = {
      unit: 'mm',
      page: {
        format: 'a4',
        width: 210,
        height: 297
      },
      nametag: {
        width: 100,
        height: 57,
        padding: 5
      }
    }

    this.cols = Math.floor(this.dimensions.page.width / this.dimensions.nametag.width);
    this.rows = Math.floor(this.dimensions.page.height / this.dimensions.nametag.height);

    this.dimensions.page.paddingTop = Math.floor((this.dimensions.page.height - this.rows * this.dimensions.nametag.height) / 2);
  }

  renderPage(pageNumber, responses) {
    const users = responses.map(r => r.user);
    while (users.length < 10) {
      users.push({});
    }
    return (
      <div className="page" key={pageNumber}>
        <div className="nametags">
          {users.map(this.renderNametag)}
        </div>
      </div>
    )
  }

  renderNametag(user) {
    return (
      <div className="nametag" key={user.id}>
        <h1><span>{capitalize(user.firstName)}</span> <span>{capitalize(user.lastName)}</span></h1>
        {user.twitterHandle && <h2>@{user.twitterHandle}</h2> }
        <p>{firstSentence(user.description, 60)}</p>
      </div>
    )
  }

  render() {
    if (this.props.data.loading) return <div>Loading</div>
    const responses = [];
    this.props.data.Event.responses.map(r => responses.push(r));
    return (
      <div className="NametagsPages">
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
            width:${this.dimensions.page.width}${this.dimensions.unit};
            zoom: .75;
          }

          body {
            width:${this.dimensions.page.width}${this.dimensions.unit};
            padding: 0;
            margin: 0;
            font-family: Lato,Helvetica,sans-serif;
            font-weight: 300;
            font-size: 1.6rem;
            line-height: 1.5;
          }

          .page {
            width: ${this.dimensions.page.width}${this.dimensions.unit};
            height: ${this.dimensions.page.height}${this.dimensions.unit};
            overflow: hidden;
            box-sizing: border-box;
            padding-top: ${this.dimensions.page.paddingTop}${this.dimensions.unit};
          }

          .nametags {
            margin: 0 auto;
            width: ${this.cols * this.dimensions.nametag.width}${this.dimensions.unit};
          }

          .nametag {
            width: ${this.dimensions.nametag.width}${this.dimensions.unit};
            height: ${this.dimensions.nametag.height}${this.dimensions.unit};
            text-align: center;
            float: left;
            padding: ${this.dimensions.nametag.padding}${this.dimensions.unit};
            box-sizing: border-box;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            align-items: center;
          
          }

          .nametag span {
            display: inline-block;
          }

          .showMarks .page {
            border: 1px solid red;
          }

          .showMarks .nametag {
            border: 1px dashed rgba(0,0,0,0.3);            
          }

          .nametag h1 {
            margin: 0;
          }

          .nametag h2 {
            color: ${colors.blue}
          }

          .nametag p {
            font-weight: 600;
          }
        `}</style>

        <div className="pages">
          {responses.map((response, index) => {
            if (index % 10 === 0) {
              return this.renderPage(index/10 + 1, responses.slice(index, index + 10));
            }
          })}
        </div>
      </div>
    );
  }
}

export default withData(addAttendeesData(Nametags));