This example demonstrates the font-size change for a string of up to 50 characters. It starts reducing the size at 10 characters, progressively going from `30px` to `5px`.

```jsx
import StyledInput from 'components/StyledInput';
const [text, setText] = React.useState('Change me!');
<div>
  <StyledInput value={text} onChange={e => setText(e.target.value)} maxLength={50} />
  <span style={{ marginLeft: 10 }}>Length: {text.length}</span>
  <br />
  <br />
  <div style={{ border: '1px solid grey' }}>
    <AutosizeText value={text} minFontSizeInPx={5} maxFontSizeInPx={30} maxLength={50} lengthThreshold={10} />
  </div>
</div>;
```

### With an input

```jsx
import StyledInput from 'components/StyledInput';
const [text, setText] = React.useState('Change me!');
<AutosizeText value={text} minFontSizeInPx={12} maxFontSizeInPx={30} maxLength={30} lengthThreshold={8}>
  {({ fontSize }) => (
    <StyledInput
      value={text}
      border="0"
      minHeight={63}
      width="100%"
      fontSize={`${fontSize}px`}
      onChange={e => setText(e.target.value)}
      maxLength={50}
    />
  )}
</AutosizeText>;
```
