import { injectIntl } from 'react-intl';
import SelectCreatable from 'react-select/creatable';

import type { StyledSelectCustomComponent } from './StyledSelect';
import { makeStyledSelect } from './StyledSelect';

/**
 * A StyledSelect with creatable activated. See https://react-select.com/creatable
 */
// @ts-expect-error theme is not properly typed. No time to spend on this as StyledSelect & styled-components are being deprecated.
const CustomStyledSelectCreatable: StyledSelectCustomComponent = makeStyledSelect(SelectCreatable, {
  alwaysSearchable: true,
});

export default injectIntl(CustomStyledSelectCreatable) as unknown as StyledSelectCustomComponent;
