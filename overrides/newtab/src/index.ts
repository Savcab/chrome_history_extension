import './page/page';

const startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
const startOfDayTimestamp = startOfDay.getTime();
console.log("startOfDayTimestamp: " + startOfDayTimestamp);

// Detect if this is localhost
if (window.location.hostname !== "localhost") {    
    // FOR TESTING
    (async function(){
        console.log(chrome);
        console.log("chrome.storage.local data: ", await chrome.storage.local.get(null));
    })();
}

// Add the single Lit component that is the entire page
document.querySelector('body')!.innerHTML = '<lit-page></lit-page>';
// add styling tags on body
document.querySelector('body')!.style.margin = "0";
document.querySelector('body')!.style.width = "100vw";
document.querySelector('body')!.style.height = "100vh";