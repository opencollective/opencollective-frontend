(function() {

  // Make sure we only load the script once.
  if (window.OC && window.OC.widgets) {
    return;
  }

  window.OC = window.OC || {};
  window.OC.widgets = [];

  window.addEventListener('message', (e) => {
    if (typeof e.data === 'string' && e.data.substr(0,3) !=='oc-') return;
    const data = JSON.parse(e.data.substr(3));
    for (let i=0; i<window.OC.widgets.length; i++) {
      if (window.OC.widgets[i].id === data.id) {
        window.OC.widgets[i].iframe.height = data.height;
        return;
      }
    }
  });

  function OpenCollectiveWidget(anchor) {

    this.anchor = anchor;
    this.styles = window.getComputedStyle(anchor.parentNode, null);
    this.id = `events-iframe-${Math.floor(Math.random()*10000)}`;

    this.getContainerWidth = () => {
        return this.anchor.parentNode.getBoundingClientRect().width - parseInt(this.styles.paddingLeft, 10) - parseInt(this.styles.paddingRight, 10);
    }

    this.getAttributes = () => {
      const attributes = {};
      [].slice.call(this.anchor.attributes).forEach((attr) => {
        attributes[attr.name] = attr.value;
      });
      return attributes;
    }

    this.inject = (e) => {
      this.anchor.parentNode.insertBefore(e, this.anchor);
    }

    const attributes = this.getAttributes();
    const limit = attributes.limit || 10;
    const width = attributes.width || this.getContainerWidth();
    const height = attributes.height || 50;
    this.iframe = document.createElement('iframe');
    this.iframe.id = this.id;
    this.iframe.src = `{{host}}/{{collectiveSlug}}/events/iframe?limit=${limit}&id=${this.id}`;
    this.iframe.width = width;
    this.iframe.height = height;
    this.iframe.frameBorder = 0;

    this.el = document.createElement('div');
    this.el.className = 'opencollective-events';
    this.el.appendChild(this.iframe);

    this.inject(this.el);

  }

  document.addEventListener("DOMContentLoaded", () => {
    const scriptsNodesArray = [].slice.call(document.querySelectorAll("script"));
    const regex = new RegExp("{{host}}".replace(/^https?:\/\//, ''),'i');
    scriptsNodesArray.map(s => {
      const src = s.getAttribute('src');
      if (src && src.match(regex) && src.match(/events\.js/)) {
        window.OC.widgets.push(new OpenCollectiveWidget(s));
      }
    });
  });

})();
