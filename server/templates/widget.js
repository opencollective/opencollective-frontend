(function() {
  // Make sure we only load the script once.
  if (window.OC && window.OC.widgets) {
    window.OC.widgets['{{widget}}'] = window.OC.widgets['{{widget}}'] || [];
    return;
  }

  window.OC = window.OC || {};
  window.OC.widgets = { '{{widget}}': [] };
  window.addEventListener('message', e => {
    if (e.origin !== '{{host}}') {
      return;
    }
    if (typeof e.data !== 'string' || e.data.substr(0, 3) !== 'oc-') {
      return;
    }
    const data = JSON.parse(e.data.substr(3));
    const widget = data.id.substr(0, data.id.indexOf('-'));
    for (let i = 0; i < window.OC.widgets[widget].length; i++) {
      if (window.OC.widgets[widget][i].id === data.id) {
        window.OC.widgets[widget][i].iframe.height = data.height + 10;
        window.OC.widgets[widget][i].loading.style.display = 'none';
        return;
      }
    }
  });

  function css(selector, property) {
    const element = document.querySelector(selector);
    if (!element) {
      return null;
    }
    return window.getComputedStyle(element, null).getPropertyValue(property);
  }

  const style =
    '{{style}}' ||
    JSON.stringify({
      body: {
        fontFamily: css('body', 'font-family'),
      },
      h2: {
        fontFamily: css('h2', 'font-family'),
        fontSize: css('h2', 'font-size'),
        color: css('h2', 'color'),
      },
      a: {
        fontFamily: css('a', 'font-family'),
        fontSize: css('a', 'font-size'),
        color: css('a', 'color'),
      },
    });

  function OpenCollectiveWidget(widget, collectiveSlug, anchor) {
    this.anchor = anchor;
    this.styles = window.getComputedStyle(anchor.parentNode, null);
    this.id = `${widget}-iframe-${Math.floor(Math.random() * 10000)}`;

    this.getContainerWidth = () => {
      return (
        this.anchor.parentNode.getBoundingClientRect().width -
        parseInt(this.styles.paddingLeft, 10) -
        parseInt(this.styles.paddingRight, 10)
      );
    };

    this.getAttributes = () => {
      const attributes = {};
      [].slice.call(this.anchor.attributes).forEach(attr => {
        attributes[attr.name] = attr.value;
      });
      return attributes;
    };

    this.inject = e => {
      this.anchor.parentNode.insertBefore(e, this.anchor);
    };

    const attributes = this.getAttributes();
    const limit = attributes.limit || 10;
    const width = attributes.width || this.getContainerWidth();
    const height = attributes.height || 0;
    this.loading = document.createElement('div');
    this.loading.className = 'oc-loading-container';
    this.logo = document.createElement('img');
    this.logo.className = 'oc-loading';
    this.logo.src = '{{host}}/static/images/opencollective-icon.svg';
    this.loading.appendChild(this.logo);
    this.iframe = document.createElement('iframe');
    this.iframe.id = this.id;
    this.iframe.src = `{{host}}/${collectiveSlug}/${widget}.html?limit=${limit}&id=${this.id}&style=${style}`;
    this.iframe.width = width;
    this.iframe.height = height;
    this.iframe.frameBorder = 0;
    this.iframe.scrolling = 'no';

    this.el = document.createElement('div');
    this.el.className = `opencollective-${widget}`;
    this.el.appendChild(this.loading);
    this.el.appendChild(this.iframe);

    this.inject(this.el);
  }

  const initStylesheet = () => {
    const style = document.createElement('style');
    // WebKit hack :(
    style.appendChild(document.createTextNode(''));
    // Add the <style> element to the page
    document.head.appendChild(style);
    style.sheet.insertRule(`
      .oc-loading-container {
        display: flex;
        justify-content: center;
        text-align: center;
      }
    `);
    style.sheet.insertRule(`
      .oc-loading {
        animation: oc-rotate 0.8s infinite linear;
      }
    `);
    style.sheet.insertRule(`
      @keyframes oc-rotate {
        0%    { transform: rotate(0deg); }
        100%  { transform: rotate(360deg); }
      }
    `);
  };

  const init = () => {
    initStylesheet();
    const scriptsNodesArray = [].slice.call(document.querySelectorAll('script'));
    const regex = new RegExp('{{host}}'.replace(/^https?:\/\//, ''), 'i');
    scriptsNodesArray.map(s => {
      const src = s.getAttribute('src');
      Object.keys(window.OC.widgets).forEach(widget => {
        if (src && src.match(regex) && src.match(new RegExp(`${widget}.js`))) {
          const tokens = src.match(new RegExp(`/([^/]+)/${widget}.js`));
          const collectiveSlug = tokens[1];
          return window.OC.widgets[widget].push(new OpenCollectiveWidget(widget, collectiveSlug, s));
        }
      });
    });
  };

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
