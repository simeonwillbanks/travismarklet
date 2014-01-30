(function(){
  var src = 'https://raw.github.com/simeonwillbanks/travismarklet/master/buildStatus.js',
      travismarklet = window._travismarklet = (window._travismarklet || {});

  if (travismarklet.injected) {
    travismarklet.init && travismarklet.init();
  } else {
    document.body.appendChild(document.createElement('script')).src=src;
    travismarklet.injected = true;
  }
})();
