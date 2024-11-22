import { LitElement, html, css, CSSResultGroup } from '../../node_modules/lit';
import { customElement, state } from '../../node_modules/lit/decorators';
import { styles } from './style';
import { ActivitySession } from '../types';
import '../userHistory/userHistory';

@customElement('lit-page')
class Page extends LitElement {

    static styles: CSSResultGroup = styles;

    @state()
        private _date: string = new Date().toDateString();

    @state()
        private _currScreentime: Array<ActivitySession> = [];

    @state()
        private _currRelMinute: number = 0;

    // Interval ID for the interval set up in windows.setInterval that updates _currRelMinute
    private _intervalId: number = 0;

    /**
     * LIFECYCLE METHODS
     */

    async connectedCallback() {
        super.connectedCallback();
        // Initialize the states
        this._updateMinutesIntoDay();
        this._intervalId = window.setInterval(() => this._updateMinutesIntoDay(), 1000 * 60);
        // const {currScreentime} = await chrome.storage.local.get(["currScreentime"]);
        // this._currScreentime = currScreentime;

        // FOR LOCALHOST TESTING
        this._currScreentime = [
            {end: 1732179056755, start: 1732178456755},
            {end: 1732217441014, start: 1732216685474},
            {end: 1732218949078, start: 1732218305413},
            {end: 1732227535116, start: 1732225447729},
            {end: 1732228444182, start: 1732227834140},
            {end: 1732230521999, start: 1732229921999},
            {end: 1732231581958, start: 1732230979337}
        ]
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        if (this._intervalId) {
            window.clearInterval(this._intervalId);
        }
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



    render() {

        return html`
            <div id='mainbody'>
                <div class='left-half'>
                    <lit-user-history 
                        .activities=${this._currScreentime}
                        date=${this._date}
                        currRelMinute=${this._currRelMinute}
                    ></lit-user-history>
                </div>
                <div class='right-half'>
                    <lit-session-details class='right-item'></lit-session-details>
                    <lit-timechart class='right-item'></lit-timechart>
                </div>
            </div>
        `;
    } 
}