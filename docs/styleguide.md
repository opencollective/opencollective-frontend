# Styleguide

We use [React-Styleguidist](https://react-styleguidist.js.org/) to develop and document our React components in isolation with [styled-components](https://www.styled-components.com/) and [styled-system](https://jxnblk.com/styled-system/).

## Start

```
npm run styleguide:dev
```

## Create a new component:

Only components with a matching example markdown file in the `styleguide/examples/` directory will appear in the styleguide. After creating a new component in the `components/` directory (i.e. `components/NewComponent.js`), make an example markdown file to go with it (i.e. `styleguide/examples/NewComponent.md`).

If you are creating a styled-component, you will need to annotate the export statement for React-Styleguidist to recognize it:

```es6
/** @component */
export default NewComponent;
```

Check out the [React-Styleguidist docs](https://react-styleguidist.js.org/docs/documenting.html) for more details about documenting components with [JSDoc](http://usejsdoc.org/) annotations and writing interactive code examples.

## Deploy

If you have access the Open Collective `now` team account:

```
npm run styleguide:deploy
```
