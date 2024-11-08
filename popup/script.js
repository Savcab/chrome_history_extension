chrome.history.search({text: ""}, function(historyItems) {
    console.log("in search")
    console.log(historyItems);
});

chrome.history.getVisits({ url: 'https://developer.chrome.com/docs/extensions/reference/api/action#inject_a_content_script_on_click' }, function(visits) {
    console.log("in getVisits");
    console.log(visits);
  });

  