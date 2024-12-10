import { LitElement, html, css, CSSResultGroup } from '../../node_modules/lit';
import { customElement, state } from '../../node_modules/lit/decorators';
import { styles } from './style';
import { ActivitySession, Tab, TabTimestamp } from '../types';
import '../userHistory/userHistory';
import '../sessionDetails/sessionDetails';

@customElement('lit-page')
class Page extends LitElement {

    // Constants
    private _minTabSeshLength = 2; // in minutes
    private _minActiveSeshGap = 15; // in minutes


    static styles: CSSResultGroup = styles;

    @state()
        _date: string = new Date().toDateString();

    @state()
        _sessions: ActivitySession[] = [];

    @state()
        _currRelMinute: number = 0;
    
    @state()
        _selectedSessionIdx = -1;

    // NOTE: need to change this into using Tab
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
            this._setTabHistory(currTabHistory);
            this._active = active;
            this._date = currDate;
            if(active) {
                currScreentime.push({
                    start: currSesh.start,
                    end: Date.now()
                })
            }
            this._setSessions(currScreentime);
        } else {
            // Localhost testing
            this._setSessions([
                {end: 1732782393918, start: 1732780868558}
            ]);
        }
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

    private async _upateStatesMinutely() {
        // update _currRelMinute
        this._updateMinutesIntoDay();

        // update _sessions
        const {active} = await chrome.storage.local.get(["active"]);

        // DEBUGGING
        console.log("IN UPDATE STATES MINUTELY");
        console.log("active: ", active);
        console.log("this._active: ", this._active);
        // Wasn't active before, but is now active - add currSesh
        if (active && !this._active) {
            const {currSesh} = await chrome.storage.local.get(["currSesh"]);
            let sessions = [...this._sessions];
            sessions.push({
                start: currSesh.start,
                end: Date.now()
            })
            this._setSessions(sessions);
        // Was active before, and also active now - update currSesh
        } else if (active && this._active) {
            let sessions = [...this._sessions];
            sessions[sessions.length - 1] = {
                start: sessions[sessions.length - 1].start,
                end: Date.now()
            }
            this._setSessions(sessions);
        // Was active before, not anymore - remove currSesh(by just setting to currScreentime)
        } else if (!active && this._active) {
            const {currScreentime} = await chrome.storage.local.get(["currScreentime"]);
            this._setSessions(currScreentime);
        }
        this._active = active;
    }

    // To do some data transforamtion before setting _tabHistory. Currently the things it does are:
    //      remove tab sessions that are less than this._minTabSeshLength
    //      remove tab sessions next to each other that have the same url
    private _setTabHistory(tabHistory: TabTimestamp[]) {
        let filtered: TabTimestamp[] = [];
        // Remove tab sessions that are less than this._minTabSeshLength
        // Include last tab no matter what
        for (let i = 0; i < tabHistory.length - 1; i++) {
            if (tabHistory[i+1].timestamp - tabHistory[i].timestamp >= this._minTabSeshLength * 60 * 1000) {
                filtered.push(tabHistory[i]);
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
    //      merge sessions taht are less that this._minactiveSeshGap minutes apart
    private _setSessions(activeSessions: ActivitySession[]) {
        // Edge case: empty list
        if (activeSessions.length === 0) {
            this._sessions = [];
            return;
        }
        const filtered: ActivitySession[] = [];
        let currSesh = activeSessions[0];
        for (let sesh of activeSessions) {
            if (sesh.start - currSesh.end <= this._minActiveSeshGap * 60 * 1000) {
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
                        <lit-timechart></lit-timechart>
                    </div>
                </div>
            </div>
        `;
    } 
}