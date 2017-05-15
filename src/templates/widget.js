(function() {

  // Make sure we only load the script once.
  if (window.OC && window.OC.buttons) {
    return;
  }

  window.OC = {
    buttons: []
  };

  class OpenCollectiveButton {

    constructor(anchor) {
      this.anchor = anchor;
      this.styles = window.getComputedStyle(anchor.parentNode, null);

      const attributes = this.getAttributes();
      const color = attributes.color || 'white';
      console.log("Attributes", attributes, color);
      const html = `<center><iframe src="{{host}}/{{collectiveSlug}}/donate/button?color=${color}" width="300" height=50 frameborder=0></iframe></center>`;

      this.el = document.createElement('div');
      this.el.className = 'opencollective-donate-button';
      this.el.innerHTML = html;

      this.inject(this.el);
    }

    getContainerWidth() {
        return this.anchor.parentNode.getBoundingClientRect().width - parseInt(this.styles.paddingLeft, 10) - parseInt(this.styles.paddingRight, 10);
    }

    getAttributes() {
      const attributes = {};
      [].slice.call(this.anchor.attributes).forEach((attr) => {
        attributes[attr.name] = attr.value;
      });
      return attributes;
    }

    inject(e) {
      this.anchor.parentNode.insertBefore(e, this.anchor);
    }

  }

  document.addEventListener("DOMContentLoaded", () => {
    const scriptsNodesArray = [].slice.call(document.querySelectorAll("script"));
    const regex = new RegExp("{{host}}".replace(/^https?:\/\//, ''),'i');
    scriptsNodesArray.map(s => {
      if (s.getAttribute('src') && s.getAttribute('src').match(regex)) {
        window.OC.buttons.push(new OpenCollectiveButton(s));
      }
    });
  });

})();
