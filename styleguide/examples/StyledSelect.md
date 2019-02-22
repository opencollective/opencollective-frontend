Default select:

```js
<StyledSelect options={['one', 'two', 'three', 'four', 'five']} />
```

Disabled
```js
<StyledSelect options={['one', 'two', 'three', 'four', 'five']} disabled />
```

Error state:
```js
<StyledSelect options={['one', 'two', 'three', 'four', 'five']} error />
```

Success state:
```js
<StyledSelect options={['one', 'two', 'three', 'four', 'five']} success />
```

Default value selected:
```js
<StyledSelect options={['one', 'two', 'three', 'four', 'five']} defaultValue="four" />
```

**Success with custom item component:**

How each item is displayed in the list and when selected can be customized through the `children` [render prop](https://reactjs.org/docs/render-props.html#using-props-other-than-render).

```js
initialState = { selected: null };
const options = {
  'hipsterbrown': {
    username: 'HipsterBrown',
    avatar: 'https://avatars0.githubusercontent.com/u/3051193?s=460&v=4',
  },
  'betree': {
    username: 'Betree',
    avatar: 'https://avatars1.githubusercontent.com/u/1556356?s=460&v=4',
  },
  'piamancini': {
    username: 'piamancini',
    avatar: 'https://avatars3.githubusercontent.com/u/3671070?s=460&v=4',
  },
  'xdamman': {
    username: 'xdamman',
    avatar: 'https://avatars0.githubusercontent.com/u/74358?s=460&v=4',
  },
  'marcogbarcellos': {
    username: 'marcogbarcellos',
    avatar: 'https://avatars0.githubusercontent.com/u/8717041?s=460&v=4',
  },
  'znarf': {
    username: 'znarf',
    avatar: 'https://avatars3.githubusercontent.com/u/806?s=460&v=4',
  },
};
<React.Fragment>
  <StyledSelect options={options} name="custom" id="custom" onChange={selected => setState({ selected })}>
    {({ value }) => <span style={{display: 'flex', alignItems: 'flex-end'}}><img src={value.avatar} alt={value.username} height={14} width="auto" style={{marginRight: '6px'}} /> {value.username}</span>}
  </StyledSelect>
  <p>Selected: {state.selected && state.selected.value.username}</p>
</React.Fragment>
```
