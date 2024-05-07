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
                border-collapse: seperate;
                border-spacing: 0px 2px;
            }
            table.main {
                padding: 0px;
            }
            td.time_highlight {
                font-weight: bold;
                color: white;
            }
            td.current {
                position: relative;
            }    
            td.current:before{
                content: "";
                position: absolute;
                top: 0;
                right: 0;
                width: 0; 
                height: 0; 
                display: block;
                border-top: calc(var(--paper-font-body1_-_line-height)*0.65) solid transparent;
                border-bottom: calc(var(--paper-font-body1_-_line-height)*0.65) solid transparent;

                border-right: 10px solid;
            }
            thead th {
                text-align: left;
                padding: 0px;
            }
            td {
                vertical-align: top;
                padding: 2px;
                spacing: 0px;
            }
            tr.rate_row{
                text-align:center;
                width:80px;
            }
            td.time {
                text-align:center;
                vertical-align: middle;
            }
            td.time_red{
                border-bottom: 1px solid Tomato;
            }
            td.time_orange{
                border-bottom: 1px solid orange;
            }
            td.time_green{
                border-bottom: 1px solid MediumSeaGreen;
            }
            td.time_lightgreen {
                border-bottom: 1px solid ForestGreen;
            }
            td.time_blue{
                border-bottom: 1px solid #391CD9;
            }
            td.time_cheapest{
                border-bottom: 1px solid LightGreen;
            }
            td.time_cheapestblue{
                border-bottom: 1px solid LightBlue;
            }
            td.rate {
                color:white;
                text-align:center;
                vertical-align: middle;
                width:80px;

                border-top-right-radius:15px;
                border-bottom-right-radius:15px;
            }
            td.red {
                border: 2px solid Tomato;
                background-color: Tomato;
            }
            td.orange {
                border: 2px solid orange;
                background-color: orange;
            }
            td.green {
                border: 2px solid MediumSeaGreen;
                background-color: MediumSeaGreen;
            }
            td.lightgreen {
                border: 2px solid ForestGreen;
                background-color: ForestGreen;
            }
            td.blue {
                border: 2px solid #391CD9;
                background-color: #391CD9;
            }
            td.cheapest {
                color: black;
                border: 2px solid LightGreen;
                background-color: LightGreen;
            }
            td.cheapestblue {
                color: black;
                border: 2px solid LightBlue;
                background-color: LightBlue;
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
            const bgColor = this.determineColor(greennessScore, config);

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

    determineColor(score, config) {
        // Determine if fixed thresholds are set and use them, otherwise use gradient
        if ('lowlimit' in config && 'mediumlimit' in config && 'highlimit' in config) {
            if (score < config.lowlimit) return 'red';
            if (score < config.mediumlimit) return 'orange';
            if (score < config.highlimit) return 'lightgreen';
            return 'green';
        } else {
            // Default gradient coloring logic
            const maxScore = 50;  // You may adjust this based on your expected maximum score
            const r = Math.round(255 - (score / maxScore) * 255);
            const g = Math.round((score / maxScore) * 255);
            return `rgb(${r}, ${g}, 0)`;
        }
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
