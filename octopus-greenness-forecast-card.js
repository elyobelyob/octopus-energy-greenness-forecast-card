class OctopusGreennessForecastCard extends HTMLElement {
    set hass(hass) {
        const config = this._config;
        if (!this.content) {
            const card = document.createElement('ha-card');
            card.header = config.title;
            this.content = document.createElement('div');
            this.content.style.padding = '0 16px 16px';

            const style = document.createElement('style');
            style.textContent = `
            table {
                width: 100%;
                padding: 0px;
                spacing: 0px;
            }
            table.main {
                padding: 0px;
            }
            td, th {
                vertical-align: top;
                padding: 2px;
                spacing: 0px;
            }
            .highlighted {
                font-weight: bold;
                background-color: #FFFFAA; // Light yellow for highlighted times
            }
            .color-coded {
                background-color: #FFFFFF; // Default background, updated dynamically
            }
            .date-time {
                background-color: #000000; // Black background for date
                color: #FFFFFF; // White text for visibility
            }
            td:last-child {
                border-top-right-radius: 15px;
                border-bottom-right-radius: 15px;
            }
            `;
            card.appendChild(style);
            card.appendChild(this.content);
            this.appendChild(card);
        }

        if (!this.lastRefreshTimestamp) {
            this.lastRefreshTimestamp = 0;
        }

        const currentTime = Date.now();
        const cardRefreshIntervalSecondsInMilliseconds = config.cardRefreshIntervalSeconds * 1000;
        if (!(currentTime - this.lastRefreshTimestamp >= cardRefreshIntervalSecondsInMilliseconds)) {
            return;
        }
        this.lastRefreshTimestamp = currentTime;

        const entityId = config.currentEntity;
        const currentstate = hass.states[entityId];
        const forecastData = currentstate.attributes.forecast;

        let tables = "<table class='main'><tbody>";
        forecastData.forEach(entry => {
            const startTime = new Date(entry.start);
            const greennessIndex = entry.greenness_index;
            const greennessScore = entry.greenness_score;
            const isHighlighted = entry.is_highlighted;
            const rowClass = isHighlighted ? 'highlighted' : 'color-coded';
            const bgColor = this.getColorForIndex(greennessIndex);

            const dayDateFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
            const dateDisplay = startTime.toLocaleDateString(undefined, dayDateFormatOptions);

            tables += `<tr class="${rowClass}">
                <td class="date-time">${dateDisplay}</td>
                <td style="background-color:${bgColor};">${greennessScore}</td>
                <td style="background-color:${bgColor}; border-top-right-radius: 15px; border-bottom-right-radius: 15px;">${greennessIndex}</td>
            </tr>`;
        });
        tables += "</tbody></table>";

        this.content.innerHTML = tables;
    }

    getColorForIndex(index) {
        const maxIndex = 50; // Maximum index for red
        const redValue = Math.round((index / maxIndex) * 255); // Calculate the red component based on the index
        return `rgb(${redValue}, 0, 0)`; // Red gradient based on index
    }

    setConfig(config) {
        if (!config.currentEntity) {
            throw new Error('You need to define an entity for greenness data.');
        }
        const defaultConfig = {
            title: 'Greenness Forecast',
            hour12: true,
            cardRefreshIntervalSeconds: 60,
            showPast: false,
            cols: 1,
            highlightCheapest: false,
            colorCoding: true,
        };
        this._config = {
            ...defaultConfig,
            ...config
        };
    }

    getCardSize() {
        return 3;
    }
}

customElements.define('octopus-greenness-forecast-card', OctopusGreennessForecastCard);

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'octopus-greenness-forecast-card',
    name: 'Octopus Greenness Forecast Card',
    preview: false,
    description: 'This card displays the greenness forecast for Octopus Energy.'
});
