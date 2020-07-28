The `<Grid />` component is a special `Box` with `display: grid` on by default. It implements the [grid layout props from styled-components](https://styled-system.com/api#grid-layout).

Some more info on CSS grids:

- [Get started](https://www.w3schools.com/css/css_grid.asp)
- [Complete guide](https://css-tricks.com/snippets/css/complete-guide-grid/)

```js
import { Grid, Box } from 'components/Grid';

<Grid gridGap={12} gridTemplateColumns="1fr 1fr 1fr">
  {Array.from(new Array(20)).map((_, idx) => (
    <Box key={idx} p={2} style={{ border: '1px solid black' }}>
      Box {idx}
    </Box>
  ))}
</Grid>;
```
