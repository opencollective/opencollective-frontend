### Types

- Default

```jsx
<StyledTag>Hello World</StyledTag>
```

- Info

```jsx
<StyledTag type="info">Hello World</StyledTag>
```

- Dark

```jsx
<StyledTag type="dark">Hello World</StyledTag>
```

- Success

```jsx
<StyledTag type="success">Hello World</StyledTag>
```

- Warning

```jsx
<StyledTag type="warning">Hello World</StyledTag>
```

- Error

```jsx
<StyledTag type="error">Hello World</StyledTag>
```

### With close button

```jsx
<StyledTag closeButtonProps={{ onClick: console.log }}>Hello World</StyledTag>{' '}
<StyledTag type="info" closeButtonProps={{ onClick: console.log }}>Hello World</StyledTag>{' '}
<StyledTag type="dark" closeButtonProps={{ onClick: console.log }}>Hello World</StyledTag>{' '}
<StyledTag type="success" closeButtonProps={{ onClick: console.log }}>Hello World</StyledTag>{' '}
<StyledTag type="warning" closeButtonProps={{ onClick: console.log }}>Hello World</StyledTag>{' '}
<StyledTag type="error" closeButtonProps={{ onClick: console.log }}>Hello World</StyledTag>
```
