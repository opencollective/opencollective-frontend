import { get } from 'lodash';

export const getCollectivePageSettings = (collective, settingName, defaultValue) => {
  return get(collective, `settings.collectivePage.${settingName}`, defaultValue);
};

export const getCollectivePrimaryColor = collective => {
  return getCollectivePageSettings(collective, 'primaryColor');
};
