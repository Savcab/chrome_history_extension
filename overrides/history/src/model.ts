import { ActivitySession, DateToActivitySession, TabTimestamp, DateToTabTimestamp, Tab } from './types'
import { minActiveSeshGap, minTabSeshLength } from './constants'

type AvailableDatesSetter = (availableDates: string[]) => void;
type SelectedDateSetter = (selectedDate: string) => void;
type SessionsSetter = (sessions: ActivitySession[]) => void;
type TabSessionsSetter = (tabSessions: Tab[]) => void;
type CurrRelMinuteSetter = (currRelMinute: number) => void;

type currSeshType = {
    start: number;
}

// This is the model in the Model View Controller structure

// This should be a singleton, but not yet becuase haven't looked into how that design pattern works
export class DataHandler {
    /*
     * PRIVATE VARIABLES 
     */
    // Straight from chrome.storage.local
    private _active: boolean = false;
    private _currDate: string = "";
    private _currScreentime: ActivitySession[] = [];
    private _pastScreentimes: DateToActivitySession = {};
    private _currTabHistory: TabTimestamp[] = [];
    private _pastTabHistories: DateToTabTimestamp = {};
    private _currSesh: currSeshType = {start: 0};

    // Own custom logic
    private _currRelMinute: number = 0;
    private _selectedDate: string = "";

    // Interval ID for the interval set up in windows.setInterval that updates _currRelMinute
    // NOTE: doesn't have custom getters and setters like the other variables
    private _intervalId: number = 0;

    /*
     * PUBSUB FUNCTIONS
     */

    // Callbacks
    private _availableDates__updated_callbacks: AvailableDatesSetter[] = [];
    private _selectedDate__updated_callbacks: SelectedDateSetter[] = [];
    private _sessions__updated_callbacks: SessionsSetter[] = [];
    private _tabSessions__updated_callbacks: TabSessionsSetter[] = [];
    private _currRelMinute__updated_callbacks: CurrRelMinuteSetter[] = [];
    
    // Publish functions
    private _publishAvailableDates() {
        this._availableDates__updated_callbacks.forEach(callback => callback(this._getAvailableDates()));
    }
    private _publishSelectedDate() {
        this._selectedDate__updated_callbacks.forEach(callback => callback(this.selectedDate));
    }
    private _publishSessions() {
        this._sessions__updated_callbacks.forEach(callback => callback(this._getSessions()));
    }
    private _publishTabSessions() {
        this._tabSessions__updated_callbacks.forEach(callback => callback(this._getTabSessions()));
    }
    private _publishCurrRelMinute() {
        this._currRelMinute__updated_callbacks.forEach(callback => callback(this.currRelMinute));
    }

    // Subscribe functions (to be called by consumers)
    public subscribeAvailableDates(callback: AvailableDatesSetter): string[] {
        this._availableDates__updated_callbacks.push(callback);
        return this._getAvailableDates();
    }
    public subscribeSelectedDate(callback: SelectedDateSetter): string {
        this._selectedDate__updated_callbacks.push(callback);
        return this.selectedDate;
    }
    public subscribeSessions(callback: SessionsSetter): ActivitySession[] {
        this._sessions__updated_callbacks.push(callback);
        return this._getSessions();
    }
    public subscribeTabSessions(callback: TabSessionsSetter): Tab[] {
        this._tabSessions__updated_callbacks.push(callback);
        return this._getTabSessions();
    }
    public subscribeCurrRelMinute(callback: CurrRelMinuteSetter): number {
        this._currRelMinute__updated_callbacks.push(callback);
        return this.currRelMinute;
    }


    /*
     * SPECIAL SETTERS + GETTERS - when the "data product"'s dependencies change, a new publish has to be triggered
     */
    set active(active: boolean) {
        this._active = active;
        if (this.currDate === this.selectedDate) {
            this._publishSessions();
        }
    }
    set currDate(currDate: string) {
        this._currDate = currDate;
        this._publishAvailableDates();
    }
    set selectedDate(selectedDate: string) {
        this._selectedDate = selectedDate;
        this._publishSelectedDate();
        this._publishSessions();
        this._publishTabSessions();
    }
    set currScreentime(currScreentime: ActivitySession[]) {
        this._currScreentime = currScreentime;
        if (this.currDate === this.selectedDate) {
            this._publishSessions();
            this._publishTabSessions();
        }
    }
    set pastScreentimes(pastScreentimes: DateToActivitySession) {
        this._pastScreentimes = pastScreentimes;
        this._publishAvailableDates();
    }
    set currTabHistory(currTabHistory: TabTimestamp[]) {
        this._currTabHistory = currTabHistory;
        if (this.currDate === this.selectedDate) {
            this._publishTabSessions();
        }
    }
    set pastTabHistories(pastTabHistories: DateToTabTimestamp) {
        this._pastTabHistories = pastTabHistories;
        this._publishAvailableDates();
    }
    set currRelMinute(currRelMinute: number) {
        this._currRelMinute = currRelMinute;
        this._publishCurrRelMinute();
        // If the today is displayed and there's an active session, need to update the last session to end at the most up to date minute
        if (this.currDate === this.selectedDate && this.active) {
            this._publishSessions();
        }
    }
    set currSesh(currSesh: currSeshType) {
        this._currSesh = currSesh;
        // Don't need to publish sessions because set active already does
    }

    get active(): boolean {return this._active;}
    get currDate(): string {return this._currDate;}
    get selectedDate(): string {return this._selectedDate;}
    get currScreentime(): ActivitySession[] {return this._currScreentime;}
    get pastScreentimes(): DateToActivitySession {return this._pastScreentimes;}
    get currTabHistory(): TabTimestamp[] {return this._currTabHistory;}
    get pastTabHistories(): DateToTabTimestamp {return this._pastTabHistories;}
    get currRelMinute(): number {return this._currRelMinute;}
    get currSesh(): currSeshType {return this._currSesh; }


    /**
     * PUBLIC FUNCTIONS
     */
    constructor() {
        // Don't do much, need to call init()
    }

    // MUST be called before being used
    async init() {
        // Initialize the states from chrome.storage.local
        const {active, currDate, currScreentime, pastScreentimes, currTabHistory, pastTabHistories, currSesh} = await chrome.storage.local.get(["active", "currDate", "currScreentime", "pastScreentimes", "currTabHistory", "pastTabHistories", "currSesh"]);
        this.active = active;
        this.currDate = currDate;
        this.currScreentime = currScreentime;
        this.pastScreentimes = pastScreentimes;
        this.currTabHistory = currTabHistory;
        this.pastTabHistories = pastTabHistories;
        this.currSesh = currSesh;
        // Initialize the rest of the states
        this.currRelMinute = this._getRelMinutesIntoDay();
        this.selectedDate = this.currDate;
        // Set up timer to keep currRelMinute up to date
        this._intervalId = window.setInterval(() => {
            this.currRelMinute = this._getRelMinutesIntoDay();
        }, 1000 * 60);

        // Add event listener for chrome.storage updates
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === "local") {
                if (changes.active) {
                    this.active = changes.active.newValue;
                }
                if (changes.currDate) {
                    // If the current selected date is the current date, update the selected date
                    let updateSelectedDate = false;
                    if (this.selectedDate === this.currDate) {
                        updateSelectedDate = true;
                    }
                    // Must update selectedDate AFTER currDate or else it will lead to errors
                    this.currDate = changes.currDate.newValue;
                    if (updateSelectedDate) {
                        this.selectedDate = this.currDate;
                    }
                }
                if (changes.currScreentime) {
                    this.currScreentime = (changes.currScreentime.newValue);
                }
                if (changes.pastScreentimes) {
                    this.pastScreentimes = (changes.pastScreentimes.newValue);
                }
                if (changes.currTabHistory) {
                    this.currTabHistory = changes.currTabHistory.newValue;
                }
                if (changes.pastTabHistories) {
                    this.pastTabHistories = changes.pastTabHistories.newValue;
                }
                if (changes.currSesh) {
                    this.currSesh = changes.currSesh.newValue;
                }
            }
        });
    }

    cleanup() {
        if (this._intervalId) {
            window.clearInterval(this._intervalId);
        }
    }

    // Set the selected date, return true if successful, false if not
    setSelectedDate(date: string): boolean {
        const availableDates = this._getAvailableDates();
        if (availableDates.includes(date)) {
            console.log("DATACONTROLLER: Setting selected date to: ", date);
            this.selectedDate = date;
            return true;
        }
        return false;
    }

    /**
     * DATA PROCESSING - these are the "data products" exposed to the view that need special processing
     */
    private _getAvailableDates(): string[] {
        const dates = Object.keys(this.pastScreentimes);
        dates.push(this.currDate);
        dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        return dates;
    }

    private _getSessions(): ActivitySession[] {
        // Choose the correct sessions
        let activeSessions: ActivitySession[] = [];
        if (this.currDate === this.selectedDate) {
            activeSessions = this.currScreentime;
            // If there is a session currently active, add it to the list
            if (this.active) {
                activeSessions.push({
                    start: this.currSesh.start,
                    end: Date.now()
                });
            }
        } else {
            activeSessions = this.pastScreentimes[this.selectedDate];
        }
        return this._processRawScreentime(activeSessions);
    }

    private _getTabSessions(): Tab[] {
        // Choose the correct tabHistory
        const tabHistory = this.currDate === this.selectedDate ? this.currTabHistory : this.pastTabHistories[this.selectedDate];
        const processedTabHistory = this._processRawTabHistory(tabHistory);
        return this._createTabSessions(processedTabHistory);
    }

    /**
     * HELPER FUNCTIONS
     */
    // Clean screentime:
    //    merge sessions that are less than minActiveSeshGap
    private _processRawScreentime(activeSessions: ActivitySession[]): ActivitySession[] {
        if (activeSessions.length === 0) {
            return [];
        }
        const filtered: ActivitySession[] = [];
        let currSesh = activeSessions[0];
        for (let sesh of activeSessions) {
            if (sesh.start - currSesh.end <= minActiveSeshGap * 60 * 1000) {
                currSesh.end = sesh.end;
            } else {
                filtered.push(currSesh);
                currSesh = sesh;
            }
        }
        // Add the last session
        filtered.push(currSesh);
        return filtered;
    }

    // Clean tabHistory (but still keep it's format):
    //      remove tab sessions that are less than minTabSeshLength
    //          The last tab and first tab of every session are immune to this
    //      remove tab sessions next to each other that have the same url
    //     add in last tab at the start of each session
    private _processRawTabHistory(tabHistory: TabTimestamp[]): TabTimestamp[] {
        const sessions = this._getSessions();
        let modified: TabTimestamp[] = [];
        // Remove tab sessions that are less than minTabSeshLength
        // The last tab of every session are immune to this
        let sessionsIdx = 0;
        let immune = false;
        for (let i = 0; i < tabHistory.length - 1; i++) {
            // If this is the first tab of a session
            if (sessionsIdx < sessions.length && tabHistory[i].timestamp >= sessions[sessionsIdx].start) {
                immune = true;
                sessionsIdx += 1;
            }
            // If immune or the time difference is greater than the minTabSeshLength
            if (immune || tabHistory[i+1].timestamp - tabHistory[i].timestamp >= minTabSeshLength * 60 * 1000) {
                modified.push(tabHistory[i]);
                immune = false;
            }
        }
        modified.push(tabHistory[tabHistory.length - 1]);

        // Remove tab sessions next to each other that have the same url
        for (let i = modified.length - 1; i > 0; i--) {
            if (modified[i].url === modified[i - 1].url) {
                modified.splice(i, 1);
            }
        }

        // Add in previous tabs at the start of each session
        //      If a sesison is started on the preivously opened tab by user interaction, this captures that
        //      This also keeps the first tab of every session consistent with session starttime
        for (let sesh of sessions) {
            const prevTab = tabHistory.filter(tab => tab.timestamp <= sesh.start).pop();
            if (prevTab) {
                modified.push({
                    url: prevTab.url,
                    timestamp: sesh.start,
                    favIconUrl: prevTab.favIconUrl,
                    title: prevTab.title
                });
            }
        }
        // Re-sort to keep timestamps in increasing order
        modified.sort((a, b) => a.timestamp - b.timestamp);
        return modified;
    }

    // Take a list of tab with timestamps and create a list of tabs with start and end times
    private _createTabSessions(tabHistory: TabTimestamp[]): Tab[] {
        // Split tab timestamps by sessions they fall into
        const sessions = this._getSessions();
        const tabTimestampGroups: TabTimestamp[][] = [];
        for (let sesh of sessions) {
            const currGroup: TabTimestamp[] = tabHistory.filter(tab => (tab.timestamp >= sesh.start && tab.timestamp <= sesh.end));
            tabTimestampGroups.push(currGroup);
        }

        // Iterate through each group and create tab sessions
        const tabSessions: Tab [] = [];
        for (let groupIdx = 0; groupIdx < tabTimestampGroups.length; groupIdx++) {
            const currTabTimestamps = tabTimestampGroups[groupIdx];
            for (let idx = 0; idx < currTabTimestamps.length; idx++) {
                // The start of the next tab, if it's the last one, the end of this activity session
                const endTimestamp = idx !== currTabTimestamps.length - 1 ? 
                    currTabTimestamps[idx + 1].timestamp : 
                    sessions[groupIdx].end;
                
                tabSessions.push({
                    url: currTabTimestamps[idx].url,
                    start: currTabTimestamps[idx].timestamp,
                    end: endTimestamp,
                    favIconUrl: currTabTimestamps[idx].favIconUrl,
                    title: currTabTimestamps[idx].title
                });
            }
        }
        return tabSessions;
    }

    // Get the number of minutes into the current day
    private _getRelMinutesIntoDay(): number {
        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return (now.getTime() - startOfDay.getTime()) / (1000 * 60);
    }

}