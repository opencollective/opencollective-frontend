For the layout of our pages and components, we use responsive grid system from [`../components/Grid`](https://www.npmjs.com/package/../components/Grid).

> All ../components/Grid components use [styled-system](https://github.com/jxnblk/styled-system) for style props, which pick up values from a theme and allow for responsive styles to be passed as array values.

The [margin and padding props](https://www.npmjs.com/package/../components/Grid#margin-and-padding-props) used the default spacing values (in pixels) from `../components/Grid`:

```md
const spacing = [0, 4, 8, 16, 32, 64, 128, 256, 512];
```
