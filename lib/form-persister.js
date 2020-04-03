import { throttle } from 'lodash';

import { removeFromLocalStorage, getFromLocalStorage, setLocalStorage } from './local-storage';

export default class FormPersister {
  constructor(formId = null, throttlePeriod = 1000) {
    this.formId = formId;
    this.saveValues = throttle(this.saveValues, throttlePeriod);
  }

  setFormId(formId) {
    this.formId = `formState-${formId}`;
  }

  saveValues(values) {
    if (this.formId) {
      setLocalStorage(this.formId, JSON.stringify(values));
    }
  }

  loadValues() {
    if (this.formId) {
      const itemFromStorage = getFromLocalStorage(this.formId);
      return JSON.parse(itemFromStorage);
    }
    return null;
  }

  clearValues() {
    if (this.formId) {
      removeFromLocalStorage(this.formId);
    }
  }
}
