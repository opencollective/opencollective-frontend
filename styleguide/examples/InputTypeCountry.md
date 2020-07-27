### Default

```js
const [locale, setLocale] = React.useState('en');
<div>
  <select onChange={e => setLocale(e.target.value)} value={locale}>
    <option value="en">English</option>
    <option value="fr">French</option>
    <option value="xx">Random (fallback to english)</option>
  </select>
  <br />
  <br />
  <InputTypeCountry onChange={console.log} locale={locale} />
</div>;
```
