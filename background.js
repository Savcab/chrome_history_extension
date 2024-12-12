// Global configurable variables
const NEWDAY_ALARM = "newday";
const SESHEND_ALARM = "sesh-end";
const TIMEOUT = 10; // 10 minutes
const KEEP_DAYS = 100;

// The keys of chrome.storage.local:
// "active"
// "currSesh" - with subkeys "start" and "end"
// "lastUserEvent" - the last user event timestamp
// "pastScreentimes" - with subkeys "11/7/2024" as dates, then inside are list of "start" and "end"
// "currScreentime" - a list of "start" and "end"s
// "currDate" - the current date
// "currTabHistory" - a list of objects with "url", "timestamp", "favIconUrl", and "title"
// "pastTabHistories" - a keys of "11/7/2024" as dates, then inside are list of "url", "timestamp", "favIconUrl", and "title"
// "currDomainTimes" - an object which maps domain(google.com) to screentime(number)
// "pastDomainTimes" - a keys of "11/7/2024" as dates, then inside are object which maps domain(google.com) to screentime(number)

/*
 * HELPER FUNCTIONS 
 */

function getMinutesUntilMidnight() {
    const now = Date.now();
    // Add buffer time of 2 minutes to ensure the next alarms goes off the start of next day
    const bufferTime = 2; 
    const midnightTime = new Date(now + 2 * 60 * 1000);
    midnightTime.setHours(24, 0, 0, 0);
    const nextMidnight = midnightTime.getTime();
    return Math.floor((nextMidnight - now) / 60000) + bufferTime;
}

/**
 * FUNCTIONS (manipulates chrome.storage.local)
 */

async function activeSeshStart(time) {
    await chrome.storage.local.set({
        "active": true,
        "currSesh": { 
            "start": time 
        },
    });
    await chrome.alarms.create(SESHEND_ALARM, {
        delayInMinutes: TIMEOUT,
    });
}

// Calculates the screentime for each domain for today
// Returns an object. Doesn't update chrome.storage.local
async function updateCurrDomainTimes() {
    const domainsScreentime = {};
    const {currTabHistory, currScreentime} = await chrome.storage.local.get(["currTabHistory", "currScreentime", "currDate"]);
    let seshIdx = 0;
    let tabIdx = 0;
    while (seshIdx != currScreentime.length && tabIdx != currTabHistory.length) {
        const tab = currTabHistory[tabIdx];
        const sesh = currScreentime[seshIdx];
        // If this tabTimestamp is before the session
        if (tab.timestamp < sesh.start) {
            tabIdx++;
        // If this tabTimestamp is after the session
        } else if (tab.timestamp > sesh.end) {
            seshIdx++;
        // If this tabTimestamp is within the session
        } else {
            const domain = this._getDomain(tab.url);
            const nextTabTime = tabIdx + 1 < currTabHistory.length ? currTabHistory[tabIdx + 1].timestamp : Infinity;
            const duration = Math.min(nextTabTime, sesh.end) - tab.timestamp;
            // Update the mapping
            domainsScreentime.domain = domainsScreentime.domain ?? 0 + duration;
            tabIdx++;
        }
    }
    console.log("CALCULATED DOMAIN SCREENTIME");
    console.log("Domain screentime:", domainsScreentime);

    // Update currDomainTimes
    await chrome.storage.local.set({
        "currDomainTimes": domainsScreentime,
    });
}

// No time needed because uses lastUserEvent + TIMEOUT
async function activeSeshEnd() {
    const {active} = await chrome.storage.local.get("active");
    if (!active) {
        return;
    }
    const {lastUserEvent, currSesh, currScreentime} = await chrome.storage.local.get(["lastUserEvent", "currSesh", "currScreentime"]);
    // Update currSesh using lastUserEvent + TIMEOUT
    currSesh.end = lastUserEvent + TIMEOUT * 1000 * 60;
    // Update currScreentimes
    currScreentime.push(currSesh);
    // Set requests
    await chrome.storage.local.set({
        "currScreentime": currScreentime,
        "currSesh": {},
        "active": false,
    });
    console.log("Sesh ended");
}

// Designed like this to minimize number of async calls
async function recordUserEvent(time) {
    await chrome.storage.local.set({"lastUserEvent": time});
}

// Called everytime a "user action" that indicates the user is active on the browser occurs
async function userEventCallback() {
    // DEBUGGING
    console.log("User event callback");
    console.log(Date.now());

    const now = Date.now();
    await recordUserEvent(now);
    const {active} = await chrome.storage.local.get("active")
    if (!active) {
        await activeSeshStart(now);
    } else {
        await chrome.alarms.clear(SESHEND_ALARM);
        await chrome.alarms.create(SESHEND_ALARM, {
            delayInMinutes: TIMEOUT,
        });
    }
}

// Helper function to clear data from stale dates
function clearStaleDates(pastHistories, staleDate) {
    const staleDateTimestamp = staleDate.getTime();
    for (const date in pastHistories) {
        timestamp = (new Date(date)).getTime();
        if (timestamp <= staleDateTimestamp) {
            delete pastHistories[date];
        }
    }
}

// Called at the end of the day to add the last screentime to pastScreentimes
// STOP ANY CURRENT SESSION
async function updateToNewDay(keepDays) {
    // Stops any currently active sessions and updates currScreentime with the last session
    await activeSeshEnd();
    // Updates currDomainTimes
    await updateCurrDomainTimes();
    // Get the current data
    const {currScreentime, pastScreentimes, currTabHistory, pastTabHistories, currDomainTimes, pastDomainTimes, currDate} = await chrome.storage.local.get(["currScreentime", "pastScreentimes", "currTabHistory", "pastTabHistories", "currDate"]);
    // Calculate the stale date 
    const currDateObj = new Date(currDate);
    const staleDate = new Date();
    staleDate.setDate(currDateObj.getDate() - keepDays);
    // Calculate today's date
    const todayStr = (new Date()).toLocaleDateString();
    // update pastScreentimes
    clearStaleDates(pastScreentimes, staleDate);
    pastScreentimes[currDate] = currScreentime;
    // update pastTabHistories
    clearStaleDates(pastTabHistories, staleDate);
    pastTabHistories[currDate] = currTabHistory;
    // Update pastDomainTimes
    clearStaleDates(pastDomainTimes, staleDate);
    pastDomainTimes[currDate] = currDomainTimes;
    // make the calls
    await chrome.storage.local.set({
        "pastScreentimes": pastScreentimes,
        "pastTabHistories": pastTabHistories,
        "pastDomainTimes": pastDomainTimes,
        "currScreentime": [],
        "currTabHistory": [],
        "currDomainTimes": {},
        "currDate": todayStr,
    })
}

/**
 * LISTENERS
 */

// On first install, setup everything
chrome.runtime.onInstalled.addListener(async ({reason}) => {
    try{
        // Only on first install, not on update, chrome update, etc.
        if (reason !== "install") {
            return;
        }
        // Create the "cronjob" newday alarms
        await chrome.alarms.create(NEWDAY_ALARM, {
            delayInMinutes: getMinutesUntilMidnight(),
        });
        // Initialize the storage
        await chrome.storage.local.set({
            "active": false,
            "currSesh": {},
            "lastUserEvent": 0,
            "pastScreentimes": {},
            "currScreentime": [],
            "currDate": new Date().toLocaleDateString(),
            "currTabHistory": [],
            "pastTabHistories": {},
            "currDomainTimes": {},
            "pastDomainTimes": {},
        });
    } catch(e) {
        console.error("BACKGROUND.JS: Error in onInstalled", e);
    }
});

// Detect when tabs are changed
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        console.log("Tab activated: ", activeInfo);
        const currTab = await chrome.tabs.get(activeInfo.tabId);
        const {currTabHistory} = await chrome.storage.local.get("currTabHistory");
        currTabHistory.push({
            "url": currTab.url,
            "timestamp": Date.now(),
            "favIconUrl": currTab.favIconUrl,
            "title": currTab.title,
        });
        await chrome.storage.local.set({
            "currTabHistory": currTabHistory,
        });

        // Also call an active session when tab is changed
        userEventCallback();
    } catch(e) {
        console.error("BACKGROUND.JS: Error in onActivated: ", e);
    }
});

// When received message from content scripts about user action
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        console.log("User action received: ", message.payload)
        if (message.type === "USERACTION") {
            userEventCallback();
        }
    } catch(e) {
        console.error("BACKGROUND.JS: Error in onMessage: ", e);
    }
});

// Alarm listeners
chrome.alarms.onAlarm.addListener(async (alarm) => {
    try {
        // At 0:00 everyday
        if (alarm.name === NEWDAY_ALARM) {
            // Schedule the next alarm
            console.log("BACKGROUND SCRIPT: newday alarm went off!");
            await chrome.alarms.create(NEWDAY_ALARM, {
                delayInMinutes: getMinutesUntilMidnight(),
            });
            await updateToNewDay(KEEP_DAYS);

        } else if (alarm.name === SESHEND_ALARM) {
            await activeSeshEnd();
        }
    } catch(e) {
        console.error("BACKGROUND.JS: Error in onAlarm: ", e);
    }
});

// Storage change
chrome.storage.onChanged.addListener((changes, area) => {
    console.log("IN STORAGE CHANGE LISTENER");
    console.log(changes);
    // When currTabHistory or currScreentime changed, update currDomainTimes
    if (changes.hasOwnProperty("currTabHistory") || changes.hasOwnProperty("currScreentime")) {
        updateCurrDomainTimes();
    }
});