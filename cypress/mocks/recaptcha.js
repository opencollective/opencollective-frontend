const mockRecaptcha = win => {
  win.grecaptcha = {
    __IS_MOCK__: true,
    ready: callback => callback(),
    reset: () => {},
    render: () => {},
    getResponse: () => {},
    execute: () => {
      return new Promise(resolve => {
        resolve('E2E_DEFAULT_RECAPTCHA_TOKEN');
      });
    },
  };
};

export default mockRecaptcha;
