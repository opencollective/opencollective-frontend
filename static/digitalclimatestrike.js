(function() {
  'use strict';
  var DOM_ID = 'DIGITAL_CLIMATE_STRIKE';
  var CLOSED_COOKIE = '_DIGITAL_CLIMATE_STRIKE_WIDGET_CLOSED_';
  var NOW = new Date().getTime();
  var MS_PER_DAY = 86400000;

  // user-configurable options
  var options = window.DIGITAL_CLIMATE_STRIKE_OPTIONS || {};
  var iframeHost = options.iframeHost !== undefined ? options.iframeHost : 'https://assets.digitalclimatestrike.net';
  var websiteName = options.websiteName || null;
  var footerDisplayStartDate = options.footerDisplayStartDate || new Date(2019, 7, 1);       // August 1st, 2019 - arbitrary date in the past
  var fullPageDisplayStartDate = options.fullPageDisplayStartDate || new Date(2019, 8, 20);  // September 20th, 2019
  var forceFullPageWidget = !!options.forceFullPageWidget;
  var cookieExpirationDays = parseFloat(options.cookieExpirationDays || 1);
  var alwaysShowWidget = !!(options.alwaysShowWidget || window.location.hash.indexOf('ALWAYS_SHOW_DIGITAL_CLIMATE_STRIKE') !== -1);
  var disableGoogleAnalytics = !!options.disableGoogleAnalytics;
  var showCloseButtonOnFullPageWidget = !!options.showCloseButtonOnFullPageWidget;
  var language = getLanguage();

  function getIframeSrc() {
    var src = iframeHost;
    src += language === 'en' ? '/index.html?' : '/index-' + language + '.html?';

    var urlParams = [
      ['hostname', window.location.host],
      ['fullPageDisplayStartDate', fullPageDisplayStartDate.toISOString()],
      ['language', language]
    ];

    forceFullPageWidget && urlParams.push(['forceFullPageWidget', 'true']);
    showCloseButtonOnFullPageWidget && urlParams.push(['showCloseButtonOnFullPageWidget', 'true']);
    disableGoogleAnalytics && urlParams.push(['googleAnalytics', 'false']);
    websiteName && urlParams.push(['websiteName', encodeURI(websiteName)]);

    var params = urlParams.map(function(el) {
      return el.join('=');
    });

    return src + params.join('&');
  }

  function createIframe() {
    var wrapper = document.createElement('div');
    wrapper.id = DOM_ID;
    var iframe = document.createElement('iframe');
    iframe.src = getIframeSrc();
    iframe.frameBorder = 0;
    iframe.allowTransparency = true;
    wrapper.appendChild(iframe);
    document.body.appendChild(wrapper);
    return wrapper;
  }

  function getLanguage() {
    var language = 'en';

    // Spanish is specified or no language is set and browser is set to spanish
    if (options.language === 'es' || (!options.language && navigator && navigator.language.match(/^es/))) {
      language = 'es';
    }

    // German is specified or no language is set and browser is set to German
    if (options.language === 'de' || (!options.language && navigator && navigator.language.match(/^de/))) {
      language = 'de';
    }

    // Czech is specified or no language is set and browser is set to German
    if (options.language === 'cs' || (!options.language && navigator && navigator.language.match(/^cs/))) {
      language = 'cs';
    }

    // French is specified or no language is set and browser is set to French
    if (options.language === 'fr' || (!options.language && navigator && navigator.language.match(/^fr/))) {
      language = 'fr';
    }

    return language;
  }

  function maximize() {
    document.getElementById(DOM_ID).style.width = '100%';
    document.getElementById(DOM_ID).style.height = '100%';
  }

  function closeWindow() {
    document.getElementById(DOM_ID).remove();
    window.removeEventListener('message', receiveMessage);
    setCookie(CLOSED_COOKIE, 'true', cookieExpirationDays);
  }

  function navigateToLink(linkUrl) {
    document.location = linkUrl;
  }

  function injectCSS(id, css) {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.id = id;
    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    }
    else {
      style.appendChild(document.createTextNode(css));
    }
    document.head.appendChild(style);
  }

  function setCookie(name, value, expirationDays) {
    var d = new Date();
    d.setTime(d.getTime()+(expirationDays * MS_PER_DAY));

    var expires = 'expires='+d.toGMTString();
    document.cookie = name + '=' + value + '; ' + expires + '; path=/';
  }

  function getCookie(cookieName) {
    var name = cookieName + '=';
    var ca = document.cookie.split(';');
    var c;

    for(var i = 0; i < ca.length; i++) {
      c = ca[i].trim();
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }

    return '';
  }

  function receiveMessage(event) {
    if (!event.data.DIGITAL_CLIMATE_STRIKE) return;

    switch (event.data.action) {
      case 'maximize':
        return maximize();
      case 'closeButtonClicked':
        return closeWindow();
      case 'buttonClicked':
        return navigateToLink(event.data.linkUrl);
    }
  }

  /**
   * There are a few circumstances when the iFrame should not be shown:
   * 1. When the CLOSED_COOKIE has been set on that device
   * 2. We haven't reached either display start date
   * 3. We're past the date to display the full screen widget.
   * 4. We haven't set alwaysShowWidget to be true in the config.
   */
  function iFrameShouldNotBeShown() {
    return (footerDisplayStartDate.getTime() > NOW && fullPageDisplayStartDate.getTime() > NOW)
      || new Date(fullPageDisplayStartDate.getTime() + MS_PER_DAY) < NOW
      || !!getCookie(CLOSED_COOKIE)
      && !alwaysShowWidget;
  }

  function initializeInterface() {
    if (iFrameShouldNotBeShown()) {
      return;
    }

    createIframe();

    var iFrameHeight = getIframeHeight();

    injectCSS('DIGITAL_STRIKE_CSS',
      '#' + DOM_ID + ' { position: fixed; right: 0; left: 0; bottom: 0px; width: 100%; height: ' + iFrameHeight + '; z-index: 20000; -webkit-overflow-scrolling: touch; overflow: hidden; } ' +
      '#' + DOM_ID + ' iframe { width: 100%; height: 100%; }'
    );

    // listen for messages from iframe
    window.addEventListener('message', receiveMessage);

    document.removeEventListener('DOMContentLoaded', initializeInterface);
  }

  function getIframeHeight() {

    var isProbablyMobile = window.innerWidth < 600;

    if (isProbablyMobile) {
      return '200px';
    } else {
      return '145px';
    }
  }

  // Wait for DOM content to load.
  switch(document.readyState) {
    case 'complete':
    case 'loaded':
    case 'interactive':
      initializeInterface();
      break;
    default:
      document.addEventListener('DOMContentLoaded', initializeInterface);
  }
})();
