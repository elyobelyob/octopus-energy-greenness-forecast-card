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
            table.sub_table {
                border-collapse: separate;
                border-spacing: 0px 2px;
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
            `;
            card.appendChild(style);
            card.appendChild(this.content);
            this.appendChild(card);
        }

        // Initialise the lastRefreshTimestamp
        if (!this.lastRefreshTimestamp) {
            this.lastRefreshTimestamp = 0;
        }

        // Check if the interval has passed
        const currentTime = Date.now();
        const cardRefreshIntervalSecondsInMilliseconds = config.cardRefreshIntervalSeconds * 1000;
        if (!(currentTime - this.lastRefreshTimestamp >= cardRefreshIntervalSecondsInMilliseconds)) {
            return;
        }
        this.lastRefreshTimestamp = currentTime;

        // Get the forecast data
        const entityId = config.currentEntity;
        const currentstate = hass.states[entityId];
        const forecastData = currentstate.attributes.forecast;

        // Construct the table content
        let tables = "<table class='main'><tbody>";
        forecastData.forEach(entry => {
            const startTime = new Date(entry.start);
            const endTime = new Date(entry.end);
            const greennessIndex = entry.greenness_index;
            const greennessScore = entry.greenness_score;
            const isHighlighted = entry.is_highlighted;
            const rowClass = isHighlighted ? 'highlighted' : '';

            // Formatting the date and time to include day and date
            const dayDateFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
            const timeFormatOptions = { hour12: config.hour12, hour: '2-digit', minute: '2-digit' };
            const timeDisplay = `${startTime.toLocaleDateString(undefined, dayDateFormatOptions)} ${startTime.toLocaleTimeString([], timeFormatOptions)} - ${endTime.toLocaleTimeString([], timeFormatOptions)}`;

            tables += `<tr class="${rowClass}">
                <td>${timeDisplay}</td>
                <td>${greennessScore}</td>
                <td>${greennessIndex}</td>
            </tr>`;
        });
        tables += "</tbody></table>";

        // Update the card content
        this.content.innerHTML = tables;
    }

    setConfig(config) {
        if (!config.currentEntity) {
            throw new Error('You need to define an entity for greenness data.');
        }
        
        // Set default configuration values
        const defaultConfig = {
            title: 'Greenness Forecast',              // Default title of the card
            hour12: true,                             // Default to 12-hour time format
            cardRefreshIntervalSeconds: 60,           // Default refresh rate of 60 seconds
            showPast: false,                          // Default setting to not show past data
            cols: 1,                                  // Default number of columns
            highlightCheapest: false,                 // Default setting for highlighting the cheapest rate
            colorCoding: true,                        // Default setting to enable color coding
        };

        // Merge user-defined configurations with the default configurations
        this._config = {
            ...defaultConfig,
            ...config
        };
    }

    getCardSize() {
        return 3;  // Adjust size as needed for your layout
    }
}

customElements.define('octopus-greenness-forecast-card', OctopusGreennessForecastCard);

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'octopus-greenness-forecast-card',
    name: 'Octopus Greenness Forecast Card',
    preview: false,  // Set to true to enable preview in the Lovelace card picker
    description: 'This card displays the greenness forecast for Octopus Energy.'
});
