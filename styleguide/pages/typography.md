The main way to deal with typography is through the components in `components/Text.js`.

# Typeface & fonts

🎨️ [Figma file](https://www.figma.com/file/jxJfC29te8i1C8qMReth95/%5BDS%5D-01-Typography?node-id=9%3A10)

The main font on Open Collective is [Inter](https://rsms.me/inter/). The colors can vary from `black.50` to `black.900` (the darkest).

```jsx
import { P } from 'components/Text';
<div>
  <P color="black.50">50: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P color="black.100">100: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P color="black.200">200: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P color="black.300">300: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P color="black.400">400: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P color="black.500">500: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P color="black.600">600: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P color="black.700">700: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P color="black.800">800: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P color="black.900">900: We are on a mission to help collaborative groups collect and spend money transparently.</P>
</div>;
```

# Type scale

You can configure the scale through `fontSize` and `lineHeight` props.

```jsx
import { P } from 'components/Text';
<div>
  <P fontSize="H1">H1: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P fontSize="H2">H2: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P fontSize="H3">H3: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P fontSize="H4">H4: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P fontSize="H5">H5: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P fontSize="H6">H6: We are on a mission to help collaborative groups collect and spend money transparently.</P>
  <P fontSize="LeadParagraph">
    LeadParagraph: We are on a mission to help collaborative groups collect and spend money transparently.
  </P>
  <P fontSize="Paragraph">
    Paragraph: We are on a mission to help collaborative groups collect and spend money transparently.
  </P>
  <P fontSize="LeadCaption">
    LeadCaption: We are on a mission to help collaborative groups collect and spend money transparently.
  </P>
  <P fontSize="Caption">
    Caption: We are on a mission to help collaborative groups collect and spend money transparently.
  </P>
  <P fontSize="SmallCaption">
    SmallCaption: We are on a mission to help collaborative groups collect and spend money transparently.
  </P>
  <P fontSize="Tiny">Tiny: We are on a mission to help collaborative groups collect and spend money transparently.</P>
</div>;
```
