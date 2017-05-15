(function() {
  let OC;

  if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, "find", {
      value: function(predicate) {
      'use strict';
      if (this == null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      const list = Object(this);
      const length = list.length >>> 0;
      const thisArg = arguments[1];
      let value;

      for (let i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
          return value;
        }
      }
      return undefined;
      }
    });
  }

  const scriptsNodesArray = [].slice.call(document.querySelectorAll("script"));
  const regex = new RegExp("{{host}}".replace(/^https?:\/\//, ''),'i');
  const anchor = scriptsNodesArray.find(s => s.getAttribute('src') && s.getAttribute('src').match(regex));

  const styles = window.getComputedStyle(anchor.parentNode, null);

  OC = {
    getContainerWidth: () => {
      return anchor.parentNode.getBoundingClientRect().width - parseInt(styles.paddingLeft, 10) - parseInt(styles.paddingRight, 10);
    },
    getAttributes: () => {
      const attributes = {};
      [].slice.call(anchor.attributes).forEach((attr) => {
        attributes[attr.name] = attr.value;
      });
      return attributes;
    },
    inject: (e) => {
      anchor.parentNode.insertBefore(e, anchor);
    }
  };

  const attributes = OC.getAttributes();
  const color = attributes.color || 'white';

  const html = `<center><iframe src="{{host}}/{{collectiveSlug}}/donate/button?color=${color}" width="300" height=50 frameborder=0></iframe></center>`;

  const e = document.createElement('div');
  e.id = 'opencollective-donate-button';
  e.innerHTML = html;

  OC.inject(e);

})();