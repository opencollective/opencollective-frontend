import { get } from 'lodash';
import { DEFAULT_PRIMARY_COLOR } from './_constants';

export const getCollectivePageSettings = (collective, settingName, defaultValue) => {
  return get(collective, `settings.collectivePage.${settingName}`, defaultValue);
};

export const getCollectivePrimaryColor = collective => {
  return getCollectivePageSettings(collective, 'primaryColor', DEFAULT_PRIMARY_COLOR);
};
