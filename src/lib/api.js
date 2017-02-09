import fetch from 'isomorphic-fetch';
import queryString from 'query-string';

class Api {

  constructor(options) {
    this.source = 'mocks';
    this.api_url = 'http://localhost:3000';
    this.user = null;
    this.delay = options.delay || 1000;
    this.onChange = options.onChange || function() {};
    this.status = this.status.bind(this);
    this.status('initializing');
  }

  status(status, error) {
    this.onChange({status, error});
    setTimeout(() => this.onChange({status: 'idle'}), 4000);
  }

  /**
   * Build url to the api
   */
  url(endpoint, params) {
    const query = queryString.stringify(params);
    return `${this.api_url + endpoint}${query.length > 0 ? `?${query}` : '' }`;
  }

  /**
   * The Promise returned from fetch() won't reject on HTTP error status. We
   * need to throw an error ourselves.
   */
  checkStatus(response) {
    const { status } = response;

    if (status >= 200 && status < 300) {
      return response.json();
    } else {
      return response.json()
      .then((json) => {
        const error = new Error(json.error.message);
        error.json = json;
        error.response = response;
        throw error;
      });
    }
  }

  makeRequest(endpoint, result, error) {
    this.onChange({ status: 'loading' });
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (error) {
          this.status('error', error);
          return reject(error);
        }
        this.status('success');
        return resolve(result)
      }, this.delay);
    })
  }

  getUserByEmail(email) {
    this.user = { email };
    this.user.id = 'userid1';
    return this.makeRequest('mock', this.user);
  }

  createUser(user) {
    this.user = user;
    this.user.id = 'userid123';
    console.log("api> createUser", this.user);
    return this.makeRequest('mock', this.user);
  }

  addCreditCardToUser(user, card) {
    console.log("api> addCreditCardToUser", user, card);
    this.user.cards = [ card ];
    return this.makeRequest('mock', this.user);
  }

  async saveResponse(response) {
    console.log("api> saving user response ", response);
    return response;
  }

}

export default Api;