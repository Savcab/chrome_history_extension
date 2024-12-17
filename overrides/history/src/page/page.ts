import { LitElement, html, css, CSSResultGroup } from '../../node_modules/lit';
import { customElement, state } from '../../node_modules/lit/decorators';
import { styles } from './style';
import { ActivitySession, Tab, TabTimestamp } from '../types';
import '../userHistory/userHistory';
import '../sessionDetails/sessionDetails';
import '../timechart/timechart';
import { minTabSeshLength, minActiveSeshGap } from '../constants';

@customElement('lit-page')
class Page extends LitElement {
    
    static styles: CSSResultGroup = styles;

    @state()
        _date: string = new Date().toDateString();

    // NOTE: this state MUST be updated using _setSessions method
    @state()
        _sessions: ActivitySession[] = [];

    @state()
        _currRelMinute: number = 0;
    
    @state()
        _selectedSessionIdx = -1;

    // NOTE: this state MUST be updated using _setTabHistory method
    @state()
        _tabHistory: TabTimestamp[] = [];

    @state()
        _active: boolean = false;

    // Interval ID for the interval set up in windows.setInterval that updates _currRelMinute
    private _intervalId: number = 0;

    /**
     * LIFECYCLE METHODS
     */

    async connectedCallback() {
        super.connectedCallback();
        // Initialize the states
        this._updateMinutesIntoDay();
        this._intervalId = window.setInterval(() => this._upateStatesMinutely(), 1000 * 60);
        if (window.location.hostname !== "localhost") {
            let {currScreentime, currTabHistory, active, currSesh, currDate} = await chrome.storage.local.get(["currScreentime", "currTabHistory", "active", "currSesh", "currDate"]);
            this._active = active;
            this._date = currDate;
            if(active) {
                currScreentime.push({
                    start: currSesh.start,
                    end: Date.now()
                })
            }
            this._setSessions(currScreentime);
            this._setTabHistory(currTabHistory);
        } else {
            // Localhost testing
            this._setSessions([
                {end: 1732782393918, start: 1732780868558}
            ]);
        }

        // Add event listener for chrome.storage updates
        chrome.storage.onChanged.addListener((changes, areaName) => {
            console.log("CHROME.STORAGE.LOCAL CHANGED!");
            console.log("changes: ", changes);
            console.log("areaName: ", areaName);
            if (areaName === "local") {
                if (changes.currScreentime) {
                    this._setSessions(changes.currScreentime.newValue);
                }
                if (changes.currTabHistory) {
                    this._setTabHistory(changes.currTabHistory.newValue);
                }
                if (changes.active) {
                    this._active = changes.active.newValue;
                }
                if (changes.currDate) {
                    this._date = changes.currDate.newValue;
                }
            }
        });
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        if (this._intervalId) {
            window.clearInterval(this._intervalId);
        }
    }

    /*
     * EVENT HANDLERS
     */
    private _onSessionSelected(event: CustomEvent) {
        event.stopPropagation();
        const idx = event.detail.idx;
        this._selectedSessionIdx = idx;
    }

    /*
     * HELPER FUNCTIONS 
     */
    private _updateMinutesIntoDay() {
        const now = new Date();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        this._currRelMinute = (now.getTime() - startOfDay.getTime()) / 1000 / 60;
    }

    // Need to update minutesIntoDay
    // Need to update _sessions to be up to date with the current session
    private async _upateStatesMinutely() {
        console.log("UPDATING STATES MINUTELY");
        // update _currRelMinute
        this._updateMinutesIntoDay();

        // If active, keep the current session up to this current timestamp
        if (this._active) {
            let {currScreentime, currSesh} = await chrome.storage.local.get(["currScreentime", "currSesh"]);
            currScreentime.push({
                start: currSesh.start,
                end: Date.now()
            });
            this._setSessions(currScreentime);
        }

        // DEBUG
        console.log("this._sessions: ", this._sessions);
    }

    // Dependant on this._sessions
    // To do some data transforamtion before setting _tabHistory. Currently the things it does are:
    //      remove tab sessions that are less than minTabSeshLength
    //          The last tab and first tab of every session are immune to this
    //      remove tab sessions next to each other that have the same url
    private _setTabHistory(tabHistory: TabTimestamp[]) {
        let filtered: TabTimestamp[] = [];
        // Remove tab sessions that are less than minTabSeshLength
        // The last tab and first tab of every session are immune to this
        let sessionsIdx = 0;
        let immune = false;
        for (let i = 0; i < tabHistory.length - 1; i++) {
            // If this is the first tab of a session
            if (sessionsIdx < this._sessions.length && tabHistory[i].timestamp >= this._sessions[sessionsIdx].start) {
                immune = true;
                sessionsIdx += 1;
            }

            // If immune or the time difference is greater than the minTabSeshLength
            if (immune || tabHistory[i+1].timestamp - tabHistory[i].timestamp >= minTabSeshLength * 60 * 1000) {
                filtered.push(tabHistory[i]);
                immune = false;
            }
        }
        filtered.push(tabHistory[tabHistory.length - 1]);

        // Remove tab sessions next to each other that have the same url
        for (let i = filtered.length - 1; i > 0; i--) {
            if (filtered[i].url === filtered[i - 1].url) {
                filtered.splice(i, 1);
            }
        }

        this._tabHistory = filtered;
    }

    // To do some data transformation before setting _session. Currently the things it does are:
    //      merge sessions that are less that minactiveSeshGap minutes apart
    private _setSessions(activeSessions: ActivitySession[]) {
        // Edge case: empty list
        if (activeSessions.length === 0) {
            this._sessions = [];
            return;
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
        this._sessions = filtered;
    }


    render() {

        return html`
            <div id='mainbody'>
                <div class='left-half'>
                    <lit-user-history 
                        .sessions=${this._sessions}
                        date=${this._date}
                        currRelMinute=${this._currRelMinute}
                        @session-selected=${this._onSessionSelected}
                    ></lit-user-history>
                </div>
                <div class='right-half'>
                    <div class='right-item'>
                        <lit-session-details 
                            date=${this._date}
                            .sessions=${this._sessions}
                            selectedSessionIdx=${this._selectedSessionIdx}
                            .tabHistory=${this._tabHistory}
                        ></lit-session-details>
                    </div>
                    <div class='right-item'>
                        <lit-timechart
                            .sessions=${this._sessions}
                            .tabHistory=${this._tabHistory}
                        ></lit-timechart>
                    </div>
                </div>
            </div>
        `;
    } 
}