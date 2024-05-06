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
                border-collapse: collapse; /* Ensures that table borders are joined together */
            }
            td, th {
                vertical-align: middle;
                padding: 2px;
                text-align: center; /* Centers the text horizontally */
                color: white; /* Sets text color to white */
                font-weight: bold; /* Makes the text bold */
            }
            .date-time {
                background-color: #000000; /* Black background for date */
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
            const bgColor = this.getColorForIndex(greennessIndex);

            const dayDateFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
            const dateDisplay = startTime.toLocaleDateString(undefined, dayDateFormatOptions);

            tables += `<tr>
                <td class="date-time">${dateDisplay}</td>
                <td style="background-color:${bgColor};">${greennessScore}</td>
                <td style="background-color:${bgColor}; border-top-right-radius: 15px; border-bottom-right-radius: 15px;">${greennessIndex}</td>
            </tr>`;
        });
        tables += "</tbody></table>";

        this.content.innerHTML = tables;
    }

    getColorForIndex(index) {
        // Interpolates between green (0) and red (50) based on the index
        const r = Math.round((index / 50) * 255);
        const g = Math.round((1 - index / 50) * 255);
        return `rgb(${r}, ${g}, 0)`;
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
