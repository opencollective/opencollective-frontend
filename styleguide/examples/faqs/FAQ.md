```js noeditor
import FAQ, { Entry, Title, Content, Separator } from 'components/faqs/FAQ';
```

```js
import FAQ, { Entry, Title, Content, Separator } from 'components/faqs/FAQ';
<FAQ title="Just another FAQ" width="350px">
  <Entry>
    <Title>Is it interactive?</Title>
    <Content>Yes</Content>
  </Entry>
  <Entry>
    <Title>And can we put anything we want in content?</Title>
    <Content>
      <img height="123" src="https://media.tenor.com/images/e5a23cc7dbfca75238635e689d562461/tenor.gif" alt="Gif" />
    </Content>
  </Entry>
  <Entry>
    <Title>And separators?</Title>
    <Content>See the line below</Content>
  </Entry>
  <Separator />
  <Entry>
    <Title>
      <span style={{ color: 'red' }}>And also custom title styles!</span>
    </Title>
    <Content>Indeed</Content>
  </Entry>
</FAQ>;
```
