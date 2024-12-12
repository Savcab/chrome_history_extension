import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ChartItem } from '../../types';

@customElement('lit-chart')
class Chart extends LitElement {

    @property({type: Array, reflect: true})
        items: ChartItem[] = [];

    /*
     * HELPER FUNCTIONS 
     */
    private _makeBarsHtml(item: ChartItem) {

        return html`
            <div class="bar"></div>
        `;
    }


    render() {
        return html`
            <div class="body">
                ${this.items.map(this._makeBarsHtml)}
            </div>
        `;
    }
}