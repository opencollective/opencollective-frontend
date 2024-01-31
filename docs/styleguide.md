# Styleguide

We use [Storybook](https://storybook.js.org/) to develop and document our React components in isolation with [styled-components](https://www.styled-components.com/) and [styled-system](https://styled-system.com/).

## Start

```
npm run styleguide:dev
```

## Create a new component:

Storybook files are defined in `mdx` format and placed in the `stories/` folder. Adding a new story could simply be done by
creating a new component in the `stories/` directory (i.e. `stories/NewComponent.js`). The steps are given below.

1. Create a file in `stories/{folderName}/{filename}.stories.mdx`
   a. Note: Normally we mimic the folder structure in the `components/` directory. If a component is in the root of the
   `components/` directory place the story in the `stories/design-system` folder.
2. Add the following imports at the top of the file:

```es6
import { ArgsTable, Meta, Story, Canvas } from '@storybook/addon-docs/blocks';
import TestedComponentName from '../components/TestedComponentName';
```

3. Add a meta header to describe the component

```jsx
<Meta
  title="Design system/ComponentName"
  component={ComponentName}
  argTypes={{
    myArg: { defaultValue: 'Click me!' },
  }}
  parameters={{
    actions: {
      handles: ['mouseover', 'click'],
    },
  }}
/>
```

4. Add a "Default" story to document the generic state of the component (when applicable)

```jsx
export const DefaultStory = props => <ComponentName {...props} />;

<Story name="Default">{DefaultStory.bind({})}</Story>

<ArgsTable story="Default" />
```

5. Wrap specific examples in blocks like:

```jsx
<Canvas>
  <Story name="Story name">
    {() => (
      /** Put the example here */
    )}
  </Story>
</Canvas>
```

6. Add and link design files:

It's nice to be able to access the relevant design files within Storybook itself. This is especially true when
we want to refer the design file for the relevant component in the future. We have [storybook-addon-designs](https://github.com/pocka/storybook-addon-designs) integrated to Storybook for this purpose. To link a design simply
add the `design` parameter;

```jsx
import { Meta, Story } from '@storybook/addon-docs/blocks';

<Meta title="My stories" />

<Story
  name="My story"
  parameters={{
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/Klm6pxIZSaJFiOMX5FpTul9F/storybook-addon-designs-sample'
    }
  }}
/>
```

For more info refer to, https://pocka.github.io/storybook-addon-designs/?path=/docs/docs-quick-start--page

You can also use features from `Storybook`, like `ArgsTable`, to provide a better documentation.
See `StyledButton.stories.mdx` as an example.

Check out the [Storybook docs](https://storybook.js.org/docs/react/get-started/introduction) for more details about documenting components.

## Deploy

If you have access the Doohi Collective `now` team account:

```
npm run styleguide:deploy
```
