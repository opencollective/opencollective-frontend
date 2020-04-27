import { injectIntl } from 'react-intl';
import SelectCreatable from 'react-select/creatable';

import { makeStyledSelect } from './StyledSelect';

/**
 * A StyledSelect with creatable activated. See https://react-select.com/creatable
 */
export default injectIntl(makeStyledSelect(SelectCreatable));
