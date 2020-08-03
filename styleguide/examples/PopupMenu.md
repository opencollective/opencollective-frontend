```jsx
import StyledButton from 'components/StyledButton';

// This div wrapper is only necessary in styleguide
<div style={{ display: 'inline-block' }}>
  <PopupMenu
    placement="bottom-start"
    Button={({ onClick }) => <StyledButton onClick={onClick}>Show me what you got</StyledButton>}
  >
    <img src="https://media.giphy.com/media/26gZ1Ye2gkRUxtj9u/giphy.gif" />
  </PopupMenu>
</div>;
```
