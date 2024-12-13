import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ChartItem } from '../../types';
import { styles } from './style';

@customElement('lit-chart')
class Chart extends LitElement {
    static styles = styles;

    @property({type: Array, reflect: true})
        items: ChartItem[] = [];

    @property({type: Number, reflect: true})
        maxValue: number = 0;

    @property({type: String, reflect: true})
        unit: string = "";

    /*
     * HELPER FUNCTIONS 
     */
    private _makeBarsHtml(item: ChartItem) {
        const style = `
            height: ${100 * item.value / this.maxValue}%;
        `;

        return html`
            <div class="bar" style=${style}>
                <div class="item-name">${item.name}</div>
            </div>
        `;
    }

    render() {
        let measurementSlots = [];
        for (let i = 1; i <= Math.floor(this.maxValue) + 1; i++) {
            const slot = html`
                <div class="measurement-line ${i === Math.floor(this.maxValue) + 1 ? "last": ""}">
                    <div class="measurement-text">
                        ${i} ${this.unit}
                    </div>
                </div>
            `;

            measurementSlots.push(slot);
        }

        return html`
            <div class="body">
                <div class="vertical-measurement-bar">
                    ${measurementSlots}
                </div>
                <!-- Create the bar items -->
                 <div class="bars-container">
                    ${this.items.map(item => this._makeBarsHtml(item))}
                </div>
            </div>
        `;
    }
}