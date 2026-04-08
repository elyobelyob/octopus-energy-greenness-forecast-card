require('../octopus-energy-greenness-forecast-card.js');

function createElement() {
  return document.createElement('octopus-energy-greenness-forecast-card');
}

function makeHass(forecast) {
  return {
    language: 'en-US',
    states: {
      'sensor.greenness': {
        attributes: {
          forecast: forecast ?? [
            {
              start: '2026-04-08T00:00:00Z',
              end: '2026-04-08T08:00:00Z',
              greenness_score: 75,
              greenness_index: 'high',
              is_highlighted: false,
            },
          ],
        },
      },
    },
  };
}

const BASE_CONFIG = { currentEntity: 'sensor.greenness' };

// ---------------------------------------------------------------------------
// determineColor
// ---------------------------------------------------------------------------
describe('determineColor', () => {
  let card;
  const thresholds = { lowLimit: 20, mediumLimit: 40, highLimit: 60 };

  beforeEach(() => {
    card = createElement();
    card.setConfig(BASE_CONFIG);
  });

  it('should return "red" when score is below lowLimit', () => {
    expect(card.determineColor(19, thresholds)).toBe('red');
  });

  it('should return "orange" when score equals lowLimit', () => {
    expect(card.determineColor(20, thresholds)).toBe('orange');
  });

  it('should return "orange" when score is between lowLimit and mediumLimit', () => {
    expect(card.determineColor(30, thresholds)).toBe('orange');
  });

  it('should return "lightgreen" when score equals mediumLimit', () => {
    expect(card.determineColor(40, thresholds)).toBe('lightgreen');
  });

  it('should return "lightgreen" when score is between mediumLimit and highLimit', () => {
    expect(card.determineColor(50, thresholds)).toBe('lightgreen');
  });

  it('should return "green" when score equals highLimit', () => {
    expect(card.determineColor(60, thresholds)).toBe('green');
  });

  it('should return "green" when score is above highLimit', () => {
    expect(card.determineColor(80, thresholds)).toBe('green');
  });
});

// ---------------------------------------------------------------------------
// formatIndexCase
// ---------------------------------------------------------------------------
describe('formatIndexCase', () => {
  let card;

  beforeEach(() => {
    card = createElement();
    card.setConfig(BASE_CONFIG);
  });

  it('should return index unchanged when caseType is undefined', () => {
    expect(card.formatIndexCase('Medium', undefined)).toBe('Medium');
  });

  it('should return index unchanged when caseType is null', () => {
    expect(card.formatIndexCase('Medium', null)).toBe('Medium');
  });

  it('should return uppercase when caseType is "uc"', () => {
    expect(card.formatIndexCase('medium', 'uc')).toBe('MEDIUM');
  });

  it('should capitalise first letter only when caseType is "ucf"', () => {
    expect(card.formatIndexCase('medium', 'ucf')).toBe('Medium');
  });

  it('should lowercase when caseType is "lc"', () => {
    expect(card.formatIndexCase('MEDIUM', 'lc')).toBe('medium');
  });

  it('should return index unchanged for an unknown caseType', () => {
    expect(card.formatIndexCase('Medium', 'xx')).toBe('Medium');
  });
});

// ---------------------------------------------------------------------------
// setConfig
// ---------------------------------------------------------------------------
describe('setConfig', () => {
  let card;

  beforeEach(() => {
    card = createElement();
  });

  it('should throw when currentEntity is not provided', () => {
    expect(() => card.setConfig({})).toThrow(
      'You need to define an entity for greenness data.'
    );
  });

  it('should apply all default values', () => {
    card.setConfig(BASE_CONFIG);
    expect(card._config).toMatchObject({
      title: 'Greenness Forecast',
      cardRefreshIntervalSeconds: 60,
      lowLimit: 20,
      mediumLimit: 40,
      highLimit: 60,
      showTimes: false,
      showDays: 7,
      showHighlighted: true,
      highlightedEmoji: '👑',
      hour12: true,
    });
  });

  it('should not include the removed "highlighted" default', () => {
    card.setConfig(BASE_CONFIG);
    expect(Object.prototype.hasOwnProperty.call(card._config, 'highlighted')).toBe(false);
  });

  it('should override defaults with provided values', () => {
    card.setConfig({ ...BASE_CONFIG, title: 'My Card', showDays: 3 });
    expect(card._config.title).toBe('My Card');
    expect(card._config.showDays).toBe(3);
  });

  it('should reset content to null so the card rebuilds', () => {
    card.setConfig(BASE_CONFIG);
    card.hass = makeHass();
    expect(card.content).not.toBeNull();

    card.setConfig(BASE_CONFIG);
    expect(card.content).toBeNull();
  });

  it('should reset lastRefreshTimestamp to 0', () => {
    card.setConfig(BASE_CONFIG);
    card.hass = makeHass();
    card.setConfig(BASE_CONFIG);
    expect(card.lastRefreshTimestamp).toBe(0);
  });

  it('should not duplicate ha-card in the DOM when called after first render', () => {
    card.setConfig(BASE_CONFIG);
    card.hass = makeHass();
    card.setConfig(BASE_CONFIG);
    card.hass = makeHass();
    expect(card.querySelectorAll('ha-card').length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// hass setter — DOM structure
// ---------------------------------------------------------------------------
describe('hass setter — DOM structure', () => {
  let card;

  beforeEach(() => {
    card = createElement();
    card.setConfig(BASE_CONFIG);
  });

  it('should create an ha-card on first render', () => {
    card.hass = makeHass();
    expect(card.querySelector('ha-card')).not.toBeNull();
  });

  it('should not duplicate ha-card on repeated hass updates', () => {
    card.hass = makeHass();
    card.lastRefreshTimestamp = 0;
    card.hass = makeHass();
    expect(card.querySelectorAll('ha-card').length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// hass setter — error states
// ---------------------------------------------------------------------------
describe('hass setter — error states', () => {
  let card;

  beforeEach(() => {
    card = createElement();
    card.setConfig(BASE_CONFIG);
  });

  it('should show error when entity is missing from hass.states', () => {
    card.hass = { language: 'en', states: {} };
    expect(card.content.innerHTML).toContain('Invalid entity');
  });

  it('should show error when forecast attribute is missing', () => {
    card.hass = {
      language: 'en',
      states: { 'sensor.greenness': { attributes: {} } },
    };
    expect(card.content.innerHTML).toContain('Invalid entity');
  });
});

// ---------------------------------------------------------------------------
// hass setter — rendering
// ---------------------------------------------------------------------------
describe('hass setter — rendering', () => {
  let card;

  beforeEach(() => {
    card = createElement();
    card.setConfig(BASE_CONFIG);
  });

  it('should render one row per forecast entry', () => {
    card.hass = makeHass([
      { start: '2026-04-08T00:00:00Z', end: '2026-04-08T08:00:00Z', greenness_score: 75, greenness_index: 'high', is_highlighted: false },
      { start: '2026-04-09T00:00:00Z', end: '2026-04-09T08:00:00Z', greenness_score: 30, greenness_index: 'low', is_highlighted: false },
    ]);
    expect(card.querySelectorAll('tr.forecast_row').length).toBe(2);
  });

  it('should limit rendered rows to showDays', () => {
    card.setConfig({ ...BASE_CONFIG, showDays: 2 });
    const entries = Array.from({ length: 5 }, (_, i) => ({
      start: `2026-04-0${i + 1}T00:00:00Z`,
      end: `2026-04-0${i + 1}T08:00:00Z`,
      greenness_score: 50,
      greenness_index: 'medium',
      is_highlighted: false,
    }));
    card.hass = makeHass(entries);
    expect(card.querySelectorAll('tr.forecast_row').length).toBe(2);
  });

  it('should apply "green" class when score is above highLimit', () => {
    card.hass = makeHass([
      { start: '2026-04-08T00:00:00Z', end: '2026-04-08T08:00:00Z', greenness_score: 75, greenness_index: 'high', is_highlighted: false },
    ]);
    expect(card.querySelector('td.forecast_score').classList.contains('green')).toBe(true);
  });

  it('should apply "red" class when score is below lowLimit', () => {
    card.hass = makeHass([
      { start: '2026-04-08T00:00:00Z', end: '2026-04-08T08:00:00Z', greenness_score: 10, greenness_index: 'low', is_highlighted: false },
    ]);
    expect(card.querySelector('td.forecast_score').classList.contains('red')).toBe(true);
  });

  it('should show highlighted emoji when is_highlighted is true and showHighlighted is true', () => {
    card.hass = makeHass([
      { start: '2026-04-08T00:00:00Z', end: '2026-04-08T08:00:00Z', greenness_score: 75, greenness_index: 'high', is_highlighted: true },
    ]);
    expect(card.content.innerHTML).toContain('👑');
  });

  it('should not show highlighted emoji when showHighlighted is false', () => {
    card.setConfig({ ...BASE_CONFIG, showHighlighted: false });
    card.hass = makeHass([
      { start: '2026-04-08T00:00:00Z', end: '2026-04-08T08:00:00Z', greenness_score: 75, greenness_index: 'high', is_highlighted: true },
    ]);
    expect(card.content.innerHTML).not.toContain('👑');
  });

  it('should not show highlighted emoji when is_highlighted is false', () => {
    card.hass = makeHass([
      { start: '2026-04-08T00:00:00Z', end: '2026-04-08T08:00:00Z', greenness_score: 75, greenness_index: 'high', is_highlighted: false },
    ]);
    expect(card.content.innerHTML).not.toContain('👑');
  });

  it('should show time range when showTimes is true', () => {
    card.setConfig({ ...BASE_CONFIG, showTimes: true });
    card.hass = makeHass([
      { start: '2026-04-08T09:00:00Z', end: '2026-04-08T17:00:00Z', greenness_score: 75, greenness_index: 'high', is_highlighted: false },
    ]);
    // Time display contains a dash separator between start and end
    expect(card.querySelector('td.time').textContent).toMatch(/ - /);
  });

  it('should not show time range when showTimes is false', () => {
    // showTimes defaults to false
    card.hass = makeHass([
      { start: '2026-04-08T09:00:00Z', end: '2026-04-08T17:00:00Z', greenness_score: 75, greenness_index: 'high', is_highlighted: false },
    ]);
    expect(card.querySelector('td.time').textContent).not.toMatch(/\d:\d/);
  });

  it('should use hass.language for date and time formatting', () => {
    const hass = makeHass([
      { start: '2026-04-08T00:00:00Z', end: '2026-04-08T08:00:00Z', greenness_score: 75, greenness_index: 'high', is_highlighted: false },
    ]);
    hass.language = 'fr-FR';
    card.hass = hass;
    // French short weekday for a Wednesday is 'mer.' — confirms locale was used
    expect(card.querySelector('td.time').textContent.toLowerCase()).toMatch(/mer/);
  });
});

// ---------------------------------------------------------------------------
// hass setter — throttling
// ---------------------------------------------------------------------------
describe('hass setter — throttling', () => {
  let card;

  beforeEach(() => {
    card = createElement();
    card.setConfig({ ...BASE_CONFIG, cardRefreshIntervalSeconds: 60 });
  });

  it('should not re-render before the refresh interval has elapsed', () => {
    card.hass = makeHass();
    const snapshot = card.content.innerHTML;
    // Different data, but within the throttle window
    card.hass = makeHass([
      { start: '2026-04-09T00:00:00Z', end: '2026-04-09T08:00:00Z', greenness_score: 10, greenness_index: 'low', is_highlighted: false },
    ]);
    expect(card.content.innerHTML).toBe(snapshot);
  });

  it('should re-render after the refresh interval has elapsed', () => {
    card.hass = makeHass();
    const snapshot = card.content.innerHTML;
    card.lastRefreshTimestamp = 0; // simulate time passing
    card.hass = makeHass([
      { start: '2026-04-09T00:00:00Z', end: '2026-04-09T08:00:00Z', greenness_score: 10, greenness_index: 'low', is_highlighted: false },
    ]);
    expect(card.content.innerHTML).not.toBe(snapshot);
  });
});
