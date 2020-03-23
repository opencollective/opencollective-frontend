(function () {
  // Make sure we only load the script once.
  if (window.OC && window.OC.buttons) {
    return;
  }

  window.OC = window.OC || {};
  window.OC.buttons = [];

  function OpenCollectiveButton(anchor) {
    this.anchor = anchor;
    this.styles = window.getComputedStyle(anchor.parentNode, null);

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
    const color = attributes.color || 'white';
    const tokens = attributes.src.match(/([a-z]+)\/button\.js/);
    const verb = tokens[1];
    const width = verb === 'donate' ? 300 : 338;
    const html = `<center><iframe src="{{host}}/{{collectiveSlug}}/${verb}/button?color=${color}" width="${width}" height=50 frameborder=0></iframe></center>`;

    this.el = document.createElement('div');
    this.el.className = 'opencollective-{{verb}}-button';
    this.el.innerHTML = html;

    this.inject(this.el);
  }

  const init = () => {
    const scriptsNodesArray = [].slice.call(document.querySelectorAll('script'));
    const regex = new RegExp('{{host}}'.replace(/^https?:\/\//, ''), 'i');
    scriptsNodesArray.map(s => {
      const src = s.getAttribute('src');
      if (src && src.match(regex) && src.match(/button\.js/)) {
        window.OC.buttons.push(new OpenCollectiveButton(s));
      }
    });
  };

  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
