let COUNTRIES = {};
let choices;

document.addEventListener('DOMContentLoaded', async () => {
  await initCountries(); // fetch countries and populate <select>

  const select = document.getElementById('country-select');
  choices = new Choices(select, {
    removeItemButton: true,
    placeholderValue: 'Select countries...',
    searchResultLimit: 10,
    renderChoiceLimit: 200
  });
});

async function initCountries() {
  const [nameRes, contRes] = await Promise.all([
    fetch('data/public/names.json'),
    fetch('data/public/continent.json')
  ]);

  const nameMap = await nameRes.json();
  const contMap = await contRes.json();
  const select = document.getElementById('country-select');

  Object.entries(nameMap).forEach(([alpha2, name]) => {
    const code = alpha2.toLowerCase();
    const key = name.toLowerCase().replace(/[^a-z]/g, '');
    const continentCode = contMap[alpha2];
    const continent = {
      NA: 'North America',
      SA: 'South America',
      EU: 'Europe',
      AS: 'Asia',
      AF: 'Africa',
      OC: 'Oceania'
    }[continentCode] || 'Other';

    const uiGroup = (continent === 'North America' && ['BZ','CR','SV','GT','HN','NI','PA'].includes(alpha2))
      ? 'Central America'
      : continent;

    COUNTRIES[key] = { name, code, continent, uiGroup };

    // ✅ Add <option> to <select>
    const option = document.createElement('option');
    option.value = key;
    option.textContent = name;
    select.appendChild(option);
  });
}

function loadSelectedTimeline() {
  const selected = choices.getValue(true);
  if (!selected.length) return alert("Please select at least one country.");
  fetchAndRender(selected);

  // ✅ Collapse the dropdown after showing the timeline
  if (choices && typeof choices.hideDropdown === 'function') {
    choices.hideDropdown();
  }
}


async function fetchAndRender(keys) {
  const allData = {};
  await Promise.all(keys.map(async key => {
    try {
      const res = await fetch(`data/${key}.json`);
      allData[key] = await res.json();
    } catch {
      allData[key] = [];
      console.warn(`Missing or invalid file: data/${key}.json`);
    }
  }));
  renderMultiTimeline(allData, keys); // pass selected country keys in order
}

function renderMultiTimeline(countryDataMap, orderedKeys) {
  const yearsMap = new Map();

  Object.entries(countryDataMap).forEach(([key, events]) => {
    events.forEach(e => {
      const m = yearsMap.get(e.year) || {};
      m[key] = e.event;
      yearsMap.set(e.year, m);
    });
  });

  const years = Array.from(yearsMap.keys()).sort((a, b) => a - b);

  // ✅ Use orderedKeys to preserve selection order
  const thead = document.getElementById('timeline-head');
  thead.innerHTML = '';
  const headRow = document.createElement('tr');
  headRow.innerHTML = `<th>Year</th>` + orderedKeys
    .map(key => {
      const c = COUNTRIES[key];
      return `<th><img src="https://flagcdn.com/24x18/${c.code}.png" alt=""> ${c.name}</th>`;
    }).join('');
  thead.appendChild(headRow);

  const tbody = document.getElementById('timeline-body');
  tbody.innerHTML = '';
  years.forEach(year => {
    const tr = document.createElement('tr');
    const label = year < 0 ? `BC ${Math.abs(year)}` : `AD ${year}`;
    tr.innerHTML = `<td><strong>${label}</strong></td>` + orderedKeys
      .map(k => `<td>${yearsMap.get(year)[k] || ''}</td>`).join('');
    tbody.appendChild(tr);
  });
}

