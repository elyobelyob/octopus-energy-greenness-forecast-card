class OctopusEnergyGreennessForecastCard extends HTMLElement {
  set hass(hass) {
    const config = this._config;
    if (!this.content) {
      const card = document.createElement("ha-card");
      card.header = config.title;
      this.content = document.createElement("div");
      this.content.style.padding = "0 16px 16px";

      const style = document.createElement("style");
      style.textContent = `
            :host {
                display: block;
                overflow: visible;
            }
            ha-card {
                overflow: visible;
                height: auto;
            }
            table {
                width: 100%;
                padding: 0px;
                border-collapse: separate;
                border-spacing: 1px
            }
            table.main {
                padding: 0px;
            }
            td {
                vertical-align: top;
                padding: 0px;
            }
            td:first-child {
                border-left: none;
            }
            td:last-child {
                border-right: none;
            }
            tr.forecast_row {
                text-align: center;
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
                border-bottom: 1px solid ForestGreen;
            }
            td.time_lightgreen {
                border-bottom: 1px solid MediumSeaGreen;
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
                border: 2px solid ForestGreen;
                background-color: ForestGreen;
            }
            td.lightgreen {
                border: 2px solid MediumSeaGreen;
                background-color: MediumSeaGreen;
            }
            td.blue {
                border: 2px solid #391CD9;
                background-color: #391CD9;
            }
            `;
      this.appendChild(style);
      card.appendChild(this.content);
      this.appendChild(card);
    }

    if (!this.lastRefreshTimestamp) {
      this.lastRefreshTimestamp = 0;
    }

    const currentTime = Date.now();
    const cardRefreshIntervalSecondsInMilliseconds =
      config.cardRefreshIntervalSeconds * 1000;
    if (
      !(
        currentTime - this.lastRefreshTimestamp >=
        cardRefreshIntervalSecondsInMilliseconds
      )
    ) {
      return;
    }
    this.lastRefreshTimestamp = currentTime;

    const entityId = config.currentEntity;
    const currentState = hass.states[entityId];

    // Validate entity and forecast data
    if (
      !currentState ||
      !currentState.attributes ||
      !currentState.attributes.forecast
    ) {
      this.content.innerHTML = `<div class="error">Invalid entity or missing forecast data.</div>`;
      return;
    }
    
    const forecastData = currentState.attributes.forecast;

    const showDays = config.showDays || 7;

    const displayLocale = hass.language || "default";
    let tables = "<table class='main'><tbody>";

    const limitedForecastData = forecastData.slice(0, showDays);

    // Generate table rows
    limitedForecastData.forEach((entry) => {
      const startTime = new Date(entry.start);
      const endTime = new Date(entry.end);
      const greennessScore = entry.greenness_score;
      const greennessIndex = this.formatIndexCase(
        entry.greenness_index,
        config.indexCase
      );
      const isHighlighted = entry.is_highlighted;
      const bgColor = this.determineColor(greennessScore, config);
      const day = startTime.toLocaleDateString(displayLocale, {
        weekday: "short",
      });
      const month = startTime.toLocaleDateString(displayLocale, {
        month: "short",
      });
      const dayNum = startTime.getDate(); // Get day as a number

      const dateDisplay = `${day} ${dayNum} ${month}`; // Adjusted format
      let highlighted = "&nbsp;"; // Initialize as empty

      if (isHighlighted && config.showHighlighted) {
        highlighted = config.highlightedEmoji;
      }

      const timeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: config.hour12 !== undefined ? config.hour12 : true,
      };
      const startTimeDisplay = startTime.toLocaleTimeString(
        displayLocale,
        timeFormatOptions
      );
      const endTimeDisplay = endTime.toLocaleTimeString(
        displayLocale,
        timeFormatOptions
      );
      const timeDisplay = `${startTimeDisplay} - ${endTimeDisplay}`;

      // Append time display conditionally based on config.showTimes
      tables += `<tr class="forecast_row">
                <td class="time time_${bgColor}">${dateDisplay} ${
        config.showTimes ? "&nbsp;&nbsp;" + timeDisplay : ""
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
    if (score < config.lowLimit) return "red";
    if (score < config.mediumLimit) return "orange";
    if (score < config.highLimit) return "lightgreen";
    return "green";
  }

  formatIndexCase(index, caseType) {
    if (!caseType) return index; // No case conversion if not specified
    switch (caseType) {
      case "uc": // Upper Case
        return index.toUpperCase();
      case "ucf": // Upper Case First
        return index.charAt(0).toUpperCase() + index.slice(1).toLowerCase();
      case "lc": // Lower Case
        return index.toLowerCase();
      default:
        return index; // Default: no change
    }
  }

  setConfig(config) {
    if (!config.currentEntity) {
      throw new Error("You need to define an entity for greenness data.");
    }
    const defaultConfig = {
      title: "Greenness Forecast",
      cardRefreshIntervalSeconds: 60,
      lowLimit: 20,
      mediumLimit: 40,
      highLimit: 60,
      showTimes: false,
      showDays: 7,
      showHighlighted: true,
      highlightedEmoji: "👑",
      hour12: true,
    };
    this._config = {
      ...defaultConfig,
      ...config,
    };
    // Reset so the card rebuilds if config changes at runtime
    this.innerHTML = '';
    this.content = null;
    this.lastRefreshTimestamp = 0;
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
