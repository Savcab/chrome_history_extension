import './page/page.ts'

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
const startOfDayTimestamp = startOfDay.getTime();
console.log("startOfDayTimestamp: " + startOfDayTimestamp);

// chrome.history.search({
//     text: '',
//     startTime: startOfDayTimestamp,
//     maxResults: 1000000 // basically no upper limit
// }, function(historyItems) {
//     console.log("in search")
//     console.log(historyItems);
// });


// // FOR TESTING
// (async function(){
//     console.log(chrome);
//     console.log("currScreentime: ", await chrome.storage.local.get(null));
//     console.log("lastUserEvent: ", await chrome.storage.local.get("lastUserEvent"));
// })();

// Add the single Lit component that is the entire page
document.querySelector('body')!.innerHTML = '<lit-page></lit-page>';
// add styling tags on body
document.querySelector('body')!.style.margin = "0";
document.querySelector('body')!.style.width = "100vw";
document.querySelector('body')!.style.height = "100vh";