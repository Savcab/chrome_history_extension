import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ChartItem } from '../types';
import { styles } from './style';
import './chart/chart';

@customElement('lit-timechart')
class TimeChart extends LitElement {

    static styles = styles;

    @property({type: Object, reflect: true}) domainTimes: Map<string, number> = new Map();

    @state() displayTop: number = 3;
    
    /*
     * HELPER FUNCTIONS 
     */
    private _hoursToString(hours: number): string {
        let numHours = Math.floor(hours);
        let numMinutes = Math.floor((hours - numHours) * 60);
        return `${numHours}h ${numMinutes}m`;
    }

    /*
     * EVENT HANDLERS 
     */
    private _onDisplayTopChange(event: Event) {
        this.displayTop = parseInt((event.target as HTMLSelectElement).value);
    }


    render() {
        // Sort the domains based on screentimes
        const domainsSorted = Array.from(this.domainTimes.keys());
        domainsSorted.sort((a, b) => (this.domainTimes.get(b) ?? 0) - (this.domainTimes.get(a) ?? 0));
        // Create data for the chart
        let items: ChartItem[] = [];
        for (let domain of domainsSorted) {
            items.push({
                name: domain,
                value: (this.domainTimes.get(domain) ?? 0) / 1000 / 60 / 60
            })
        }
        let screentimeSum = items.reduce((acc, item) => acc + item.value, 0);
        return html`
            <div class="body">
                <div class="total-time">
                    Total screentime: ${this._hoursToString(screentimeSum)}
                </div>
                <div class="graph-title">
                    Screentime by domain <br>
                    <div class="dropdown">
                        Show top  <select @change=${this._onDisplayTopChange} .value=${this.displayTop.toString()}>
                            <option value=3>3 domains</option>
                            <option value=5>5 domains</option>
                            <option value=10>10 domains</option>
                            <option value=20>20 domains</option>
                        </select>
                    </div>
                </div>
                <lit-chart
                    class="chart"
                    .items=${items.slice(0, this.displayTop)}
                    .maxValue=${screentimeSum}
                ></lit-chart>
            </div>
        `;
    }
}