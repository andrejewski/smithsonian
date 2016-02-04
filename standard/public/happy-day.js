(function() {

  var days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];
  
  function happyDay($els) {
    Array.prototype.map.call($els, function($el) {
      $el.innerText = "Happy "+days[(new Date()).getDay()]+"!";
    });
  }
  
  this.happyDay = happyDay;
  happyDay(document.querySelectorAll(".x-happy-day"));
  
}).call(this);