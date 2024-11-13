// Global configurable variables
const NEWDAY_ALARM = "newday";
const SESHEND_ALARM = "sesh-end";
const TIMEOUT = 1; // 10 minutes
const KEEP_DAYS = 7;

// The keys of chrome.storage.local:
// "active"
// "currSesh" - with subkeys "start" and "end"
// "lastUserEvent" - the last user event timestamp
// "pastScreentimes" - with subkeys "11/7/2024" as dates, then inside are list of "start" and "end"
// "currScreentime" - a list of "start" and "end"s
// "currDate" - the current date
// "currTabHistory" - a list of objects with "url" and "timestamp"
// "pastTabHistories" - a keys of "11/7/2024" as dates, then inside are list of "url" and "timestamp"


/**
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
    for (const date in pastHistories) {
        timestamp = (new Date(date)).getTime();
        if (timestamp <= staleDate.getTime()) {
            delete pastHistories[date];
        }
    }
}

// Called at the end of the day to add the last screentime to pastScreentimes
// STOP ANY CURRENT SESSION
async function updateToNewDay(keepDays) {
    const {currScreentime, pastScreentimes, currTabHistory, pastTabHistories, currDate} = await chrome.storage.local.get(["currScreentime", "pastScreentimes", "currTabHistory", "pastTabHistories", "currDate"]);
    // Stops any currently active sessions
    await activeSeshEnd();
    // Calculate the stale date 
    const currDateObj = new Date(currDate);
    const staleDate = new Date();
    staleDate.setDate(currDateObj.getDate() - keepDays);
    // Calculate today's date
    const todayStr = (new Date()).toLocaleDateString();
    // update pastScreentimes
    clearStaleDates(pastScreentimes, staleDate.getTime());
    pastScreentimes[currDate] = currScreentime;
    // update pastTabHistories
    clearStaleDates(pastTabHistories, staleDate.getTime());
    pastTabHistories[currDate] = currTabHistory;
    // make the calls
    await chrome.storage.local.set({
        "pastScreentimes": pastScreentimes,
        "pastTabHistories": pastTabHistories,
        "currScreentime": [],
        "currTabHistory": [],
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
        });
        await chrome.storage.local.set({
            "currTabHistory": currTabHistory,
        });
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