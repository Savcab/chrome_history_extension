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

function getMinutesUntilMidnight() {
    const now = Date.now();
     // add 2 minute as buffer
    const bufferTime = new Date(now + 2 * 60 * 1000);
    bufferTime.setHours(24, 0, 0, 0);
    const nextMidnight = bufferTime.getTime();
    return Math.floor((nextMidnight - now) / 60000);
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

// Called at the end of the day to add the last screentime to pastScreentimes
async function updatePastScreentimes(keepDays) {
    const {currScreentime, pastScreentimes} = await chrome.storage.local.get(["currScreentime", "pastScreentimes"]);
    // yesterdays string
    const yday = new Date();
    yday.setDate(yday.getDate() - 1);
    const ydayStr = yday.toLocaleDateString();
    // Calculate the stale date 
    const staleDate = new Date();
    staleDate.setDate(yday.getDate() - keepDays);
    // Calculate today's date
    const todayStr = (new Date()).toLocaleDateString();
    // update pastScreentimes
    for (const date of pastScreentimes) {
        timestamp = (new Date(date)).getTime();
        if (timestamp <= staleDate.getTime()) {
            delete pastScreentimes[date];
        }
    }
    pastScreentimes[ydayStr] = currScreentime;
    // make the calls
    await chrome.storage.local.set({
        "pastScreentimes": pastScreentimes,
        "currScreentime": {},
        "currDate": todayStr,
    })
}

// On first install, setup everything
chrome.runtime.onInstalled.addListener(async ({reason}) => {
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
    });
});

// When received message from content scripts about user action
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("User action received: ", message.payload)
    if (message.type === "USERACTION") {
        userEventCallback();
    }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    // At 0:00 everyday
    if (alarm.name === NEWDAY_ALARM) {
        // Schedule the next alarm
        await chrome.alarms.create(NEWDAY_ALARM, {
            delayInMinutes: getMinutesUntilMidnight(),
        });
        await updatePastScreentimes(KEEP_DAYS);

    } else if (alarm.name === SESHEND_ALARM) {
        await activeSeshEnd();
    }
});