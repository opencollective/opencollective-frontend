# States

- Indeterminate

```js
<StyledProgressBar />
```

- 0%

```js
<StyledProgressBar percentage={0} />
```

- 20%

```js
<StyledProgressBar percentage={0.2} />
```

- 150% (value is clamped between 0 and 1)

```js
<StyledProgressBar percentage={1.5} />
```

# Customize

```js
<StyledProgressBar percentage={0.75} height={20} borderRadius={0} color="primary.400" backgroundColor="red.700" />
```

# With text inside

```jsx
<StyledProgressBar percentage={0.75} height={20}>
  75%
</StyledProgressBar>
```

# Animated

```jsx
const [progress, setProgress] = React.useState(0);

<div>
  <button
    onClick={() => {
      let tmpProgress = 0;
      setInterval(() => {
        tmpProgress = tmpProgress + 0.07;
        setProgress(tmpProgress);
      }, 500);
    }}
  >
    Start animation
  </button>
  <hr />
  <StyledProgressBar percentage={progress} height={20}>
    {Math.round(progress * 100)}%
  </StyledProgressBar>
</div>;
```
