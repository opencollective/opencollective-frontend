```js
import { P } from 'components/Text';

const content = () => <P>Hello, I&apos;m a tooltip!</P>;

<StyledTooltip content={content}>
  <P display="inline">Hover, focus, or click on me</P>
</StyledTooltip>;
```

```js
import { P } from 'components/Text';
import { Info } from '@styled-icons/feather/Info';

const content = () => (
  <div>
    <P fontWeight="bold" mb={2}>
      Example heading
    </P>
    <P fontSize="Caption" lineHeight="Caption">
      Example text. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
      et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
      commodo consequat.
    </P>
  </div>
);

<StyledTooltip content={content}>
  <Info size={16} />
</StyledTooltip>;
```
