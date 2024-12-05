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
        _currScreentime: Array<ActivitySession> = [];

    @state()
        _currRelMinute: number = 0;
    
    @state()
        _selectedSessionIdx = -1;

    @state()
        _currTabHistory: TabTimestamp[] = [];

    @state()
        _active: boolean = false;

    @state()
        _currSeshStart: number = 0;

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

            const {currScreentime, currTabHistory, active, currSesh, currDate} = await chrome.storage.local.get(["currScreentime", "currTabHistory", "active", "currSesh", "currDate"]);
            this._currScreentime = currScreentime;
            this._currTabHistory = currTabHistory;
            this._active = active;
            this._date = currDate;
            if(active) {
                this._currSeshStart = currSesh.start;
            }
        } else {
            // Localhost testing
            this._currScreentime = [
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
        this._updateMinutesIntoDay();
        const {active, currSesh} = await chrome.storage.local.get(["active", "currSesh"]);
        this._active = active;
        if (active) {
            this._currSeshStart = currSesh.start;
        } else {
            this._currSeshStart = 0;
        }
    }



    render() {

        return html`
            <div id='mainbody'>
                <div class='left-half'>
                    <lit-user-history 
                        .sessions=${this._currScreentime}
                        date=${this._date}
                        currRelMinute=${this._currRelMinute}
                        ?active=${this._active}
                        currSeshStart=${this._currSeshStart}
                        @session-selected=${this._onSessionSelected}
                    ></lit-user-history>
                </div>
                <div class='right-half'>
                    <lit-session-details 
                        class='right-item'
                        date=${this._date}
                        .sessions=${this._currScreentime}
                        selectedSessionIdx=${this._selectedSessionIdx}
                        .tabHistory=${this._currTabHistory}
                    ></lit-session-details>
                    <lit-timechart class='right-item'></lit-timechart>
                </div>
            </div>
        `;
    } 
}