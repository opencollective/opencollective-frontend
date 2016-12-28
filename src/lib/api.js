
class Api {

  constructor(options) {
    this.source = 'mocks';
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

  saveResponse(response) {
    console.log("api> saving user response ", response);
    return this.makeRequest('mock', true);
  }

}

export default Api;