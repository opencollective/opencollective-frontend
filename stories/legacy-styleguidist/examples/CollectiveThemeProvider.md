# With color picker

```js
import CollectiveColorPicker from 'components/collective-page/hero/CollectiveColorPicker';
import StyledButton from 'components/StyledButton';
import { P } from 'components/Text';
const [primaryColor, setPrimaryColor] = React.useState('#000000');
const collective = { settings: { collectivePage: { primaryColor } } };
<CollectiveThemeProvider collective={collective}>
  <CollectiveColorPicker collective={collective} onChange={setPrimaryColor} />
  <br />
  <br />
  <P color="primary.50">Text color primary 50</P>
  <P color="primary.100">Text color primary 100</P>
  <P color="primary.200">Text color primary 200</P>
  <P color="primary.300">Text color primary 300</P>
  <P color="primary.400">Text color primary 400</P>
  <P color="primary.500">Text color primary 500</P>
  <P color="primary.600">Text color primary 600</P>
  <P color="primary.700">Text color primary 700</P>
  <P color="primary.800">Text color primary 800</P>
  <P color="primary.900">Text color primary 900</P>
  <br />
  <br />
  <StyledButton buttonStyle="primary" buttonSize="large" m={2}>
    Primary
  </StyledButton>
  <StyledButton buttonStyle="secondary" buttonSize="large" m={2}>
    Secondary
  </StyledButton>
</CollectiveThemeProvider>;
```

# Compare with default

```js
import StyledButton from 'components/StyledButton';
import { P } from 'components/Text';
const [primaryColor, setPrimaryColor] = React.useState('#000000');

<div style={{ display: 'flex' }}>
  <div>
    <CollectiveThemeProvider>
      <h4>Default theme</h4>
      <P fontWeight="bold" color="primary.50">
        Text color primary 50
      </P>
      <P fontWeight="bold" color="primary.100">
        Text color primary 100
      </P>
      <P fontWeight="bold" color="primary.200">
        Text color primary 200
      </P>
      <P fontWeight="bold" color="primary.300">
        Text color primary 300
      </P>
      <P fontWeight="bold" color="primary.400">
        Text color primary 400
      </P>
      <P fontWeight="bold" color="primary.500">
        Text color primary 500
      </P>
      <P fontWeight="bold" color="primary.600">
        Text color primary 600
      </P>
      <P fontWeight="bold" color="primary.700">
        Text color primary 700
      </P>
      <P fontWeight="bold" color="primary.800">
        Text color primary 800
      </P>
      <P fontWeight="bold" color="primary.900">
        Text color primary 900
      </P>
      <br />
      <br />
      <StyledButton buttonStyle="primary" buttonSize="large" m={2}>
        Primary
      </StyledButton>
      <StyledButton buttonStyle="secondary" buttonSize="large" m={2}>
        Secondary
      </StyledButton>
    </CollectiveThemeProvider>
  </div>
  <div>
    <CollectiveThemeProvider collective={{ settings: { collectivePage: { primaryColor: '#297EFF' } } }}>
      <h4>Generated theme</h4>
      <P fontWeight="bold" color="primary.50">
        Text color primary 50
      </P>
      <P fontWeight="bold" color="primary.100">
        Text color primary 100
      </P>
      <P fontWeight="bold" color="primary.200">
        Text color primary 200
      </P>
      <P fontWeight="bold" color="primary.300">
        Text color primary 300
      </P>
      <P fontWeight="bold" color="primary.400">
        Text color primary 400
      </P>
      <P fontWeight="bold" color="primary.500">
        Text color primary 500
      </P>
      <P fontWeight="bold" color="primary.600">
        Text color primary 600
      </P>
      <P fontWeight="bold" color="primary.700">
        Text color primary 700
      </P>
      <P fontWeight="bold" color="primary.800">
        Text color primary 800
      </P>
      <P fontWeight="bold" color="primary.900">
        Text color primary 900
      </P>
      <br />
      <br />
      <StyledButton buttonStyle="primary" buttonSize="large" m={2}>
        Primary
      </StyledButton>
      <StyledButton buttonStyle="secondary" buttonSize="large" m={2}>
        Secondary
      </StyledButton>
    </CollectiveThemeProvider>
  </div>
</div>;
```

# Palette

This example is pretty heavy, so we hide it by default.

```js
import StyledButton from 'components/StyledButton';
import { P } from 'components/Text';
const [primaryColor, setPrimaryColor] = React.useState('#000000');
const [enabled, setEnabled] = React.useState(false);
const collective = { settings: { collectivePage: { primaryColor } } };
const COLORS = [
  '#BE2721',
  '#F65316',
  '#D17C07',
  '#1E824C',
  '#1D8882',
  '#1F3993',
  '#663299',
  '#2E3131',
  '#E94531',
  '#ED7529',
  '#F89308',
  '#19B156',
  '#12ADA4',
  '#3062BC',
  '#9E28B4',
  '#6D7A89',
  '#FA533E',
  '#F6A050',
  '#FFA413',
  '#1AC780',
  '#55C9BC',
  '#3E8DCE',
  '#B13BC6',
  '#95A5A6',
];
<div>
  <button onClick={() => setEnabled(!enabled)}>Show/hide example</button>
  {enabled &&
    COLORS.map(primaryColor => (
      <div>
        <CollectiveThemeProvider collective={{ settings: { collectivePage: { primaryColor } } }}>
          <br />
          Base color
          <div style={{ background: primaryColor, width: 80, height: 20 }} />
          <br />
          <br />
          <P color="primary.50">Text color primary 50</P>
          <P color="primary.100">Text color primary 100</P>
          <P color="primary.200">Text color primary 200</P>
          <P color="primary.300">Text color primary 300</P>
          <P color="primary.400">Text color primary 400</P>
          <P color="primary.500">Text color primary 500</P>
          <P color="primary.600">Text color primary 600</P>
          <P color="primary.700">Text color primary 700</P>
          <P color="primary.800">Text color primary 800</P>
          <P color="primary.900">Text color primary 900</P>
          <br />
          <br />
          <StyledButton buttonStyle="primary" buttonSize="large" m={2}>
            Primary
          </StyledButton>
          <StyledButton buttonStyle="secondary" buttonSize="large" m={2}>
            Secondary
          </StyledButton>
        </CollectiveThemeProvider>
        <hr />
      </div>
    ))}
</div>;
```
