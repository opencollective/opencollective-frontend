```jsx
<StyledDropzone onSuccess={console.log} />
```

## Customize message

### Additional message

```jsx
<StyledDropzone onSuccess={console.log}>Hello World</StyledDropzone>
```

### Override default message

```jsx
<StyledDropzone onSuccess={console.log} showDefaultMessage={false}>
  Hello World
</StyledDropzone>
```

## Custom size

```jsx
<StyledDropzone onSuccess={console.log} size={150} />
```

```jsx
<StyledDropzone onSuccess={console.log} size={60} showDefaultMessage={false}>
  DnD
</StyledDropzone>
```

## Loading state

```jsx
<StyledDropzone onSuccess={console.log} size={150} isLoading />
```

```jsx
<StyledDropzone onSuccess={console.log} isLoading />
```

### Show progress

```jsx
<StyledDropzone onSuccess={console.log} isLoading loadingProgress={100} />
```
