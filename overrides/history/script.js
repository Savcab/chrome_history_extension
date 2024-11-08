const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
const startOfDayTimestamp = startOfDay.getTime();
console.log("startOfDayTimestamp: " + startOfDayTimestamp);

chrome.history.search({
    text: "",
    startTime: startOfDayTimestamp,
    maxResults: 1000000 // basically no upper limit
}, function(historyItems) {
    console.log("in search")
    console.log(historyItems);
});