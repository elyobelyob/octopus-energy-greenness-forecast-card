class OctopusEnergyGreennessForecastCard extends HTMLElement {
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
                border-collapse: separate;
                border-spacing: 1px
            }
            table.main {
                padding: 0px;
            }
            td, th {
                vertical-align: top;
                padding: 0px;
            }
            th:first-child, td:first-child {
                border-left: none;  /* No left border for the first cell */
            }
            th:last-child, td:last-child {
                border-right: none;  /* No right border for the last cell */
            }
            td.time_highlight {
                font-weight: bold;
                color: white;
            }
            td.current {
                position: relative;
            }    
            td.current:before {
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
            tr.forecast_row {
                text-align:center;
                width:80px;
            }
            td.time {
                text-align:center;
                vertical-align: middle;
            }
            td.time_red {
                border-bottom: 1px solid Tomato;
            }
            td.time_orange {
                border-bottom: 1px solid orange;
            }
            td.time_green {
                border-bottom: 1px solid MediumSeaGreen;
            }
            td.time_lightgreen {
                border-bottom: 1px solid ForestGreen;
            }
            td.time_blue {
                border-bottom: 1px solid #391CD9;
            }
            td.forecast_score {
                color:white;
                text-align:center;
                vertical-align: middle;
                width:80px;
            }
            td.forecast_index {
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
        const currentState = hass.states[entityId];
        const forecastData = currentState.attributes.forecast;

        const showDays = config.showDays || 7;

        let tables = "<table class='main'><tbody>";

        const limitedForecastData = forecastData.slice(0, showDays);        

        // Generate table rows
        limitedForecastData.forEach((entry) => {
          const startTime = new Date(entry.start);
          const endTime = new Date(entry.end);
          const greennessIndex = entry.greenness_index;
          const greennessScore = entry.greenness_score;
          const isHighlighted = entry.is_highlighted;
          const bgColor = this.determineColor(greennessScore, config); // Ensure this returns a CSS color value

          const day = startTime.toLocaleDateString("en-US", {
            weekday: "short",
          }); // Adjusted for specific locale
          const month = startTime.toLocaleDateString("en-US", {
            month: "short",
          });
          const dayNum = startTime.getDate(); // Get day as a number

          const dateDisplay = `${day} ${dayNum} ${month}`; // Adjusted format
          let highlighted = "&nbsp;"; // Initialize as empty

          if (isHighlighted) {
            highlighted = `👑`;
          }

          const timeFormatOptions = {
            hour: "2-digit",
            minute: "2-digit",
            hour12: config.hour12,
          };
          const startTimeDisplay = startTime.toLocaleTimeString(
            "en-US",
            timeFormatOptions
          );
          const endTimeDisplay = endTime.toLocaleTimeString(
            "en-US",
            timeFormatOptions
          );
          const timeDisplay = `${startTimeDisplay} - ${endTimeDisplay}`;

          // Append time display conditionally based on config.showTimes
          tables += `<tr class="forecast_row">
                <td class="time time_${bgColor}">${dateDisplay} ${
            config.showTimes ? timeDisplay : ""
          } ${highlighted} </td>
                <td class="forecast_score ${bgColor}">${greennessScore}</td>
                <td class="forecast_index ${bgColor}">${greennessIndex}</td>
            </tr>`;
        });

tables += "</tbody></table>";

        this.content.innerHTML = tables;
    }

    determineColor(score, config) {
        // Determine if fixed thresholds are set and use them, otherwise use gradient
        if (score < config.lowLimit) return 'red';
        if (score < config.mediumLimit) return 'orange';
        if (score < config.highLimit) return 'lightgreen';
        return 'green';
    }

    setConfig(config) {
        if (!config.currentEntity) {
            throw new Error('You need to define an entity for greenness data.');
        }
        const defaultConfig = {
            title: 'Greenness Forecast',
            cardRefreshIntervalSeconds: 60,
            lowLimit: 20,
            mediumLimit: 40,
            highLimit: 60,
            highlighted: true,
            showTimes: false,
            showDays: 7,
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

customElements.define('octopus-energy-greenness-forecast-card', OctopusEnergyGreennessForecastCard);

window.customCards = window.customCards || [];
window.customCards.push({
    type: 'octopus-energy-greenness-forecast-card',
    name: 'Octopus Energy Greenness Forecast Card',
    preview: false,
    description: 'This card displays the greenness forecast for Octopus Energy.'
});
