import React from 'react';
import algoliasearch from 'algoliasearch';
import { pickAvatar } from '../lib/collective.lib';

class Search extends React.Component {

  constructor(props) {
    super(props);
    const algoliaAppId = 'LJZOBZL3H3';
    const algoliaSearchOnlyKey = '3bc7285b51e6caaf67928ba3955951e3';

    const client = algoliasearch(algoliaAppId, algoliaSearchOnlyKey);

    const index = client.initIndex("collectives");

    this.state = {
      results: [],
      index
    };
  }

  search(event) {
    const text = event.target.value.toLowerCase();
    if (!text || /^\s*$/.test(text)) {
      this.setState({ results: [] });
      return;
    }
    return this.state.index.search(text)
      .then(res => {
        const results = (res.hits || []).splice(0, 5);
        this.setState({ results });
      })
  }

  getLinkForItem(item) {
    if (!item.slug) return null;
    return `/${item.slug}`;
  }

  getImageForItem(item) {
    if (!item.image) return pickAvatar();
    if (!item.image.startsWith('http')) return pickAvatar();
    return item.image;
  }

  render() {
    return (
      <div className="outerContainer">
        <style jsx>{`
        .outerContainer {
          position: relative;
          z-index: 100;
        }
        .card {
          box-shadow: 0 1px 3px 0 rgba(45,77,97,.2);
          background-color: #fff;
          border-radius: 5px;
          outline: none;
          border: none;
        }
        .searchContainer {
          position: relative;
        }
        .search {
          margin-top: 40px;
          font-size: 16px;
          padding: 0 20px;
          display: block;
          height: 60px;
          width: 100%;
        }
        .results {
          margin-bottom: 30px;
          position: absolute;
          margin-top: 10px;
          width: 100%;
        }
        .resultItem {
          border-bottom: 1px solid rgba(0,0,0,0.1);
          text-decoration: none;
          padding: 20px 0;
          display: block;
        }
        .resultItem:hover {
          background-color: rgba(0,0,0,0.05);
        }
        .resultImageContainer {
          vertical-align: text-top;
          display: inline-block;
          text-align: left;
          width: 20%;
        }
        .resultContainer {
          vertical-align: text-top;
          display: inline-block;
          text-align: left;
          width: 80%;
        }
        @media screen and (max-width: 640px) {
          .resultImageContainer, .resultContainer {
            text-align: center;
            display: block;
            width: auto;
          }
          .resultContainer {
            margin-top: 10px;
          }
        }
        .resultImage {
          background-color: rgba(0,0,0,0.05);
          display: inline-block;
          border-radius: 35px;
          object-fit: cover;
          margin: 0 20px;
          border: none;
          height: 70px;
          width: 70px;
        }
        .resultTitle {
          font-size: 18px;
          display: block;
          color: black;
        }
        .resultDescription {
          margin-top: 5px;
          display: block;
          color: black;
        }
        `}</style>
        <div className="searchContainer">
          <input
            placeholder="Search through projects..."
            onChange={event => this.search(event)}
            className="card search"
            type="search" />
        </div>
        {this.state.results &&
          <div className="card results">
            {this.state.results.map(item => (
              <a key={item.id} className="resultItem" href={this.getLinkForItem(item)} target="_blank">
                <div className="resultImageContainer">
                  <img
                    src={this.getImageForItem(item)}
                    className="resultImage"
                    alt={item.name} />
                </div>
                <div className="resultContainer">
                  <span className="resultTitle">{item.name}</span>
                  <span className="resultDescription">{item.description}</span>
                </div>
              </a>
            ))}
          </div>
        }
      </div>
    )
  }
}

export default Search;