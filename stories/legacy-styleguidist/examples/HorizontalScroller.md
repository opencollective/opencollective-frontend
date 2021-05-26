```jsx
const itemWidth = 80;
const marginRight = 20;
const elements = Array.from(Array(20).keys());
let scrollableElementRef = null;

<HorizontalScroller>
  {(ref, Chevrons) => (
    <div>
      <Chevrons />
      <br />
      <div ref={ref} style={{ display: 'flex', overflowX: 'auto', padding: 16, scrollBehavior: 'smooth' }}>
        {elements.map(boxNum => (
          <div
            key={boxNum}
            style={{
              flexBasis: itemWidth,
              height: itemWidth,
              marginRight: marginRight,
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: `#${(boxNum * boxNum * 10000).toString(16).padStart(6, '0')}`,
              color: 'white',
            }}
          >
            {boxNum}
          </div>
        ))}
      </div>
    </div>
  )}
</HorizontalScroller>;
```
