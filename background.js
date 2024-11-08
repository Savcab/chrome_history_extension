// alarm names
const NEWDAY_ALARM = "newday";
const SESHEND_ALARM = "sesh-end";
const TIMEOUT = 10; // 10 minutes

// The keys of chrome.storage.local:
// "active"
// "currSesh" - with subkeys "start" and "end"
// "lastUserEvent" - the last user event timestamp
// "pastScreentimes" - with subkeys "11/7/2024" as dates, then inside are list of "start" and "end"
// "currScreentime" - a list of "start" and "end"s
// "currDate" - the current date

function getMinutesUntilMidnight() {
    const now = new Date();
     // add 2 minute as buffer
    const nextMidnight = new Date(now + 2 * 60 * 1000).setHours(24, 0, 0, 0);
    return Math.floor(nextMidnight - now / 60000);
}

async function activeSeshStart(time) {
    await chrome.storage.local.set("active", true);
    await chrome.storage.local.set("currSesh", { start: time });
    await chrome.alarms.create(SESHEND_ALARM, {
        delayInMinutes: TIMEOUT,
    });
}

// No time needed because uses lastUserEvent + TIMEOUT
async function activeSeshEnd() {
    if (await chrome.storage.local.get("active") === false) {
        return;
    }
    await chrome.storage.local.set("active", false);
    // Update currSesh using lastUserEvent + TIMEOUT
    const lastUserEvent = await chrome.storage.local.get("lastUserEvent");
    const currSesh = await chrome.storage.local.get("currSesh");
    currSesh.end = lastUserEvent + TIMEOUT * 1000 * 60;
    // Update currScreentimes
    const screentime = await chrome.storage.local.get("currScreentime");
    screentime.push(currSesh);
    // Set requests
    await chrome.storage.local.set("currScreentime", screentime);
    await chrome.storage.local.set("currSesh", {});
}

// Designed like this to minimize number of async calls
async function recordUserEvent(time) {
    await chrome.storage.local.set("lastUserEvent", time);
}

async function userEventCallback() {
    const now = new Date();
    await recordUserEvent(now);
    const active = await chrome.storage.local.get("active");
    if (!active) {
        await activeSeshStart(now);
    } else {
        await chrome.alarms.clear(SESHEND_ALARM);
        await chrome.alarms.create(SESHEND_ALARM, {
            delayInMinutes: TIMEOUT,
        });
    }
}

async function updatePastScreentimes(keepDays) {
    // yesterdays string
    const thisScreentime = await chrome.storage.local.get("currScreentime");
    const yday = new Date();
    yday.setDate(yday.getDate() - 1);
    const ydayStr = yday.toLocaleDateString();
    // 6 days ago
    const staleDate = new Date();
    staleDate.setDate(yday.getDate() - keepDays);
    const staleDateStr = staleDate.toLocaleDateString();
    // update pastScreentimes
    const pastScreentimes = await chrome.storage.local.get("pastScreentimes");
    if (staleDateStr in pastScreentimes) {
        delete pastScreentimes[staleDateStr];
    }
    pastScreentimes[ydayStr] = thisScreentime;
    // make the calls
    await chrome.storage.local.set("pastScreentimes", pastScreentimes);
    await chrome.storage.local.set("currScreentime", {});
}

// Set up "cron job" to run every day at midnight
chrome.runtime.onInstalled.addListener(async () => {
    // Only on first install, not on update, chrome update, etc.
    if (reason!== "install") {
        return;
    }
    await chrome.alarms.create(NEWDAY_ALARM, {
        delayInMinutes: getMinutesUntilMidnight(),
    });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    // At 0:00 everyday
    if (alarm.name === NEWDAY_ALARM) {
        // Schedule the next alarm
        await chrome.alarms.create(NEWDAY_ALARM, {
            delayInMinutes: getMinutesUntilMidnight(),
        });

    } else if (alarm.name === SESHEND_ALARM) {
        await activeSeshEnd();
    }
});