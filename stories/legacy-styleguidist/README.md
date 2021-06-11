# About this folder

Our styleguide used to be based on [Styleguidist](https://react-styleguidist.js.org/. However,
this tool stopped working for us and since it wasn't as maintained as Storybook, we chose to
move to the second. More info about that on this issue: https://github.com/opencollective/opencollective/issues/3388.

This folder stores the legacy pages and examples that should ideally be migrated to Storybook.

# How to migrate a component

1. Move the file from `legacy-styleguidist/{path}/{filename}.md` to `./{path}/{filename}.stories.mdx`
   a. Note: If the file is at the root of `legacy-styleguidist`, it should be moved to `design-system`
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

You can also use features from `Storybook`, like `ArgsTable`, to provide a better documentation.
See `StyledButton.stories.mdx` as an example.
