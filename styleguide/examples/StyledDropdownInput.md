**Simple dropdown input:**

```js
initialState = { selected: null };
<React.Fragment>
  <StyledDropdownInput options={['first', 'second', 'third']} name="simple" id="simple" onChange={selected => setState({ selected })} />
  <p>Selected: {state.selected && state.selected.value}</p>
</React.Fragment>
```

**Disabled dropdown input:**

```js
<StyledDropdownInput options={['first', 'second', 'third']} name="disabled" id="disabled" disabled />
```

**Error dropdown input:**

```js
<StyledDropdownInput options={['first', 'second', 'third']} name="error" id="error" error />
```

**Success dropdown input:**

```js
<StyledDropdownInput options={['first', 'second', 'third']} name="success" id="success" success />
```

**Simple select with filtered results:**

Type to see list filter from input.

```js
initialState = { selected: null };
const filter = (inputValue, item) => !inputValue || item.value.includes(inputValue);
<React.Fragment>
  <StyledDropdownInput options={['first', 'second', 'third']} name="filtered" id="filtered" filter={filter} onChange={selected => setState({ selected })} />
  <p>Selected: {state.selected && state.selected.value}</p>
</React.Fragment>
```

**Dropdown input with long list:**

The max-height for the menu of items is set to 200px.

```js
initialState = { selected: null };
const options = Array(100).fill(0).map((value, index) => value + index);
const itemToString = item => (item ? `Item ${item.value}` : null);
<React.Fragment>
  <StyledDropdownInput options={options} name="long" id="long" onChange={selected => setState({ selected })} itemToString={itemToString}>
    {({ value }) => `Item ${value}`}
  </StyledDropdownInput>
  <p>Selected: {itemToString(state.selected)}</p>
</React.Fragment>
```

**Dropdown input with custom item component:**

How each item is displayed in the list can be customized through the `children` [render prop](https://reactjs.org/docs/render-props.html#using-props-other-than-render). When selected, an `itemToString` function prop must be used display the selected value in the input. 

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
  <StyledDropdownInput options={options} name="custom" id="custom" onChange={selected => setState({ selected })} itemToString={item => item ? item.value.username : null}>
    {({ value }) => <span style={{display: 'flex', alignItems: 'flex-end'}}><img src={value.avatar} alt={value.username} height={14} width="auto" style={{marginRight: '6px'}} /> {value.username}</span>}
  </StyledDropdownInput>
  <p>Selected: {state.selected && state.selected.value.username}</p>
</React.Fragment>
```
