export default class FormPersister {
  timer = null;

  constructor(formId = null, throttlePeriod = 1500) {
    this.formId = formId;
    this.throttlePeriod = throttlePeriod;
  }

  setFormId(formId) {
    this.formId = formId;
  }

  saveValues(values) {
    if (this.formId) {
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(
        () => window.localStorage.setItem(this.formId, JSON.stringify(values)),
        this.throttlePeriod,
      );
    }
  }

  loadValues() {
    if (this.formId) {
      const itemFromStorage = window.localStorage.getItem(this.formId);
      return JSON.parse(itemFromStorage);
    }
    return null;
  }

  clearValues() {
    if (this.formId) {
      window.localStorage.removeItem(this.formId);
    }
  }
}
