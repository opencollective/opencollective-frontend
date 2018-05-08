import { setWorldConstructor } from 'cucumber';

class CustomWorld {
  constructor() {
    this.state = {};
  }
  addValue(key, value) {
    this.state[key] = value;
  }
  getValue(key) {
    return this.state[key];
  }
}

setWorldConstructor(CustomWorld);
