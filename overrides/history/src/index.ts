import './page/page.ts'

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
const startOfDayTimestamp = startOfDay.getTime();
console.log("startOfDayTimestamp: " + startOfDayTimestamp);

chrome.history.search({
    text: '',
    startTime: startOfDayTimestamp,
    maxResults: 1000000 // basically no upper limit
}, function(historyItems) {
    console.log("in search")
    console.log(historyItems);
});


// FOR TESTING
(async function(){
    console.log(chrome);
    console.log("currScreentime: ", await chrome.storage.local.get(null));
    console.log("lastUserEvent: ", await chrome.storage.local.get("lastUserEvent"));
})();


document.querySelector('body')!.innerHTML = '<page></page>';
