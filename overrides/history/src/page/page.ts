import { LitElement, html, css, CSSResultGroup } from '../../node_modules/lit';
import { customElement, state } from '../../node_modules/lit/decorators';
import { styles } from './style';
import { ActivitySession, Tab, TabTimestamp } from '../types';
import '../userHistory/userHistory';
import '../sessionDetails/sessionDetails';

@customElement('lit-page')
class Page extends LitElement {

    static styles: CSSResultGroup = styles;

    @state()
        _date: string = new Date().toDateString();

    @state()
        _sessions: Array<ActivitySession> = [];

    @state()
        _currRelMinute: number = 0;
    
    @state()
        _selectedSessionIdx = -1;

    @state()
        _currTabHistory: TabTimestamp[] = [];

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
            this._currTabHistory = currTabHistory;
            this._active = active;
            this._date = currDate;
            if(active) {
                currScreentime.push({
                    start: currSesh.start,
                    end: Date.now()
                })
            }
            this._sessions = currScreentime;
        } else {
            // Localhost testing
            this._sessions = [
                {end: 1732782393918, start: 1732780868558}
            ];
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
        // Wasn't active before, but is now active - add currSesh
        if (active && !this._active) {
            const {currSesh} = await chrome.storage.local.get(["currSesh"]);
            let sessions = [...this._sessions];
            sessions.push({
                start: currSesh.start,
                end: Date.now()
            })
        // Was active before, and also active now - update currSesh
        } else if (active && this._active) {
            let sessions = [...this._sessions];
            sessions[sessions.length - 1] = {
                start: sessions[sessions.length - 1].start,
                end: Date.now()
            }
        // Was active before, not anymore - remove currSesh(by just setting to currScreentime)
        } else if (!active && this._active) {
            const {currScreentime} = await chrome.storage.local.get(["currScreentime"]);
            this._sessions = currScreentime;
        }
        this._active = active;
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
                            .tabHistory=${this._currTabHistory}
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