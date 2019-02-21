;
(function () {
  window.ms = {
    set: set,
    get: get,
  };

  function set(key, val) {
    var value = JSON.stringify(val);
    localStorage.setItem(key, value);
  }

  function get(key) {
    var json = localStorage.getItem(key);
    if (json) {
      return JSON.parse(json);
    }
  }

})();