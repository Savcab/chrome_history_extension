import { LitElement, html, CSSResultGroup } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { styles } from './style';
import { ActivitySession, Tab } from '../types';
import '../userHistory/userHistory';
import '../sessionDetails/sessionDetails';
import '../timechart/timechart';
import { DataHandler } from '../model';

@customElement('lit-page')
class Page extends LitElement {

    static styles: CSSResultGroup = styles;

    // This is the model from model view controller
    @state() _dataHandler = new DataHandler();

    // States that are outputs of dataHandler
    @state() _selectedDate: string = new Date().toDateString();
    @state() _availableDates: string[] = [];
    @state() _sessions: ActivitySession[] = [];
    @state() _tabSessions: Tab[] = [];
    @state() _currRelMinute: number = 0;
    @state() _domainTimes: Map<string, number> = new Map();

    // States that are used to display and handled by page
    @state() _selectedSessionIdx: number = -1;
    @state() _initialized: boolean = false;

    /**
     * LIFECYCLE METHODS
     */

    async connectedCallback() {
        super.connectedCallback();
        await this._dataHandler.init();
        // Subscribe to the dataHanlder
        this._selectedDate = this._dataHandler.subscribeSelectedDate((newSelectedDate) => {
            this._selectedDate = newSelectedDate
            // Reset selected session index
            this._selectedSessionIdx = -1;
        });
        this._availableDates = this._dataHandler.subscribeAvailableDates((newAvailableDates) => {
            this._availableDates = newAvailableDates
        });
        this._sessions = this._dataHandler.subscribeSessions((newSessions) => {
            this._sessions = newSessions
        });
        this._tabSessions = this._dataHandler.subscribeTabSessions((newTabSessions) => {
            this._tabSessions = newTabSessions
        });
        this._currRelMinute = this._dataHandler.subscribeCurrRelMinute((newCurrRelMinute) => {
            this._currRelMinute = newCurrRelMinute
        });
        this._domainTimes = this._dataHandler.subscribeDomainTimes((newDomainTimes) => {
            this._domainTimes = newDomainTimes
        });
        this._initialized = true;
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        this._dataHandler.cleanup();
    }

    /*
     * EVENT HANDLERS
     */
    private _onSessionSelected(event: CustomEvent) {
        event.stopPropagation();
        this._selectedSessionIdx = event.detail.idx;
    }

    private _onDateChange(event: Event) {
        event.stopPropagation();
        const newDate = (event.target as HTMLSelectElement).value;
        console.log("PAGE: new date selected: ", newDate);
        this._dataHandler.setSelectedDate(newDate);
    }

    render() {
        if (!this._initialized) {
            return html`<div>Loading...</div>`;
        }
        return html`
            <div id='mainbody'>
                <div class='left-half'>
                    <select  @change=${this._onDateChange} class='select-date'>
                        ${this._availableDates.map((date) => html`
                            <option value=${date} ?selected=${date === this._selectedDate}>${date}</option>
                        `)}
                    </select>
                    <lit-user-history 
                        .sessions=${this._sessions}
                        date=${this._selectedDate}
                        currRelMinute=${this._currRelMinute}
                        selectedSessionIdx=${this._selectedSessionIdx}
                        @session-selected=${this._onSessionSelected}
                    ></lit-user-history>
                </div>
                <div class='right-half'>
                    <div class='right-item'>
                        <lit-session-details 
                            date=${this._selectedDate}
                            .sessions=${this._sessions}
                            selectedSessionIdx=${this._selectedSessionIdx}
                            .tabSessions=${this._tabSessions}
                        ></lit-session-details>
                    </div>
                    <div class='right-item'>
                        <lit-timechart
                            .domainTimes=${this._domainTimes}
                        ></lit-timechart>
                    </div>
                </div>
            </div>
        `;
    } 
}