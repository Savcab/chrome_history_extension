import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ActivitySession, TabTimestamp } from '../types';

@customElement('lit-timechart')
class TimeChart extends LitElement {

    @property({type: Array, reflect: true})
        sessions: ActivitySession[] = [];

    @property({type: Array, reflect: true})
        tabHistory: TabTimestamp[] = [];

    @state()
        _domainsScreentime: Map<string, number> = new Map();

    /*
     * LIFECYCLE METHODS 
     */
    connectedCallback() {
        super.connectedCallback();
        // Parse the sessions and tabHistory to get the domain times
        this._calculateDomainTimes();

    }

    
    /*
     * HELPER FUNCTIONS 
     */
    private _calculateDomainTimes() {
        console.log("HERE0");
        console.log(this.sessions);
        console.log(this.tabHistory);
        const domainsScreentime: Map<string, number> = new Map();
        let seshIdx = 0;
        let tabIdx = 0;
        while (seshIdx != this.sessions.length && tabIdx != this.tabHistory.length) {
            const tab = this.tabHistory[tabIdx];
            const sesh = this.sessions[seshIdx];
            // If this tabTimestamp is before the session
            if (tab.timestamp < sesh.start) {
                tabIdx++;
            // If this tabTimestamp is after the session
            } else if (tab.timestamp > sesh.end) {
                seshIdx++;
            // If this tabTimestamp is within the session
            } else {
                const domain = this._getDomain(tab.url);
                const nextTabTime = tabIdx + 1 < this.tabHistory.length ? this.tabHistory[tabIdx + 1].timestamp : Infinity;
                const duration = Math.min(nextTabTime, sesh.end) - tab.timestamp;
                // Update the mapping
                domainsScreentime.set(domain, domainsScreentime.get(domain) ?? 0 + duration);
                tabIdx++;
            }
        }
        // DONT SET FOR TESTING
        // this._domainsScreentime = domainsScreentime;
        console.log("CALCULATED DOMAIN SCREENTIME");
        console.log("Domain screentime:", this._domainsScreentime);
        return domainsScreentime;
    }

    private _getDomain(url: string) {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.hostname;
        } catch (error) {
            console.error("Invalid URL:", error);
            return url;
        }
    }


    render() {
        // For testing
        const mapAsString = JSON.stringify(Array.from(this._calculateDomainTimes().entries()));

        return html`
            ${mapAsString}
        `;
    }
}