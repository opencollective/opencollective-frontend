
class Api {

  constructor(options) {
    this.source = 'mocks';
    this.user = null;
  }

  getUserByEmail(email) {
    return Promise.resolve(null);
  }

  createUser(user) {
    this.user = user;
    this.user.id = 'userid123';
    console.log("api> createUser", this.user);
    return this.user;
  }

  addCreditCardToUser(user, card) {
    console.log("api> addCreditCardToUser", user, card);
    this.user.cards = [ card ];
    return this.user;
  }

  rsvp(data) {
    console.log("api> rsvp ", data);
    return true;
  }

}

export default Api;