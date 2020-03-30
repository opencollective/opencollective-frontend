import { get } from 'lodash';

/** Retrieve variables set in the environment */
export const getEnvVar = v => (process.browser ? get(window, ['__NEXT_DATA__', 'env', v]) : get(process, ['env', v]));
