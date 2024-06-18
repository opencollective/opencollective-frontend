import { injectIntl } from 'react-intl';
import SelectCreatable from 'react-select/creatable';

import type { StyledSelectCustomComponent } from './StyledSelect';
import { makeStyledSelect } from './StyledSelect';

/**
 * A StyledSelect with creatable activated. See https://react-select.com/creatable
 */
const CustomStyledSelectCreatable: StyledSelectCustomComponent = makeStyledSelect(SelectCreatable, {
  alwaysSearchable: true,
});

export default injectIntl(CustomStyledSelectCreatable);
