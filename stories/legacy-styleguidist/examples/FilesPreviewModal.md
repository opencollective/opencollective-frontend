```jsx
const [isOpen, setOpen] = React.useState(true);
<div>
  <button onClick={() => setOpen(true)}>Show modal</button>
  <FilesPreviewModal
    show={isOpen}
    onClose={() => setOpen(false)}
    files={[
      { url: 'https://loremflickr.com/600/600/invoice?lock=1' },
      { url: 'https://loremflickr.com/400/1200/invoice?lock=2' },
      { url: 'https://loremflickr.com/210/290/invoice?lock=3' },
      { url: 'https://loremflickr.com/700/600/invoice?lock=4' },
      { url: 'https://loremflickr.com/600/600/invoice?lock=5' },
      { url: 'https://loremflickr.com/600/600/invoice?lock=6' },
      { url: 'https://loremflickr.com/600/600/invoice?lock=7' },
      { url: 'https://loremflickr.com/600/600/invoice?lock=8' },
      { url: 'https://loremflickr.com/600/600/invoice?lock=9' },
      { url: 'https://loremflickr.com/600/600/invoice?lock=10' },
    ]}
  />
</div>;
```
