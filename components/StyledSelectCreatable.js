import SelectCreatable from 'react-select/creatable';
import { makeStyledSelect } from './StyledSelect';
import { injectIntl } from 'react-intl';

/**
 * A StyledSelect with creatable activated. See https://react-select.com/creatable
 */
export default injectIntl(makeStyledSelect(SelectCreatable));
