import React from 'react';

import { getRecaptcha, getRecaptchaSiteKey, loadRecaptcha, unloadRecaptcha } from '../recaptcha';

const useRecaptcha = () => {
  const verify = async () => {
    const grecaptcha = await getRecaptcha();
    return new Promise(resolve => {
      grecaptcha.ready(() => {
        grecaptcha.execute(getRecaptchaSiteKey(), { action: 'submit' }).then(resolve);
      });
    });
  };

  React.useEffect(() => {
    loadRecaptcha();
    return () => unloadRecaptcha();
  }, []);

  return { verify };
};

export default useRecaptcha;
