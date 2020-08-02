let allSensors = [];
let selectedCityId = 'cluj-napoca';

async function getAndDisplayData() {
  drawNeighborhoods();
  await getAndPopulateDevices();
  drawNeighborhoods();

  // setInterval(async () => {
  //   await getAndPopulateClujDevices();
  //   drawNeighborhoods();
  // }, 20 * 1000);
}

function drawNeighborhoods() {
  const pageRoot = document.getElementById('root');

  pageRoot.innerHTML = '';

  neighborhoods[selectedCityId].forEach(({ id, name, imageUrl, type }) => {
    const overallGrade = getGradeForNeighborhood(id);

    const { pm1, pm25, pm10 } = getPmAveragesForNeighborhood(id);

    const neighborhoodHtml = getHtmlForNeighborhood({ id, name, type, value: overallGrade, imageUrl, pm1, pm25, pm10 });

    pageRoot.insertAdjacentHTML('beforeend', neighborhoodHtml);
  });
}

async function getAndPopulateDevices() {
  const response = await fetch('https://data.uradmonitor.com/api/v1/devices/', {
    method: 'GET',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'X-User-hash': 'global',
      'X-User-id': 'www',
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
  });

  allSensors = await response.json();
}

function isAvailable(sensor) {
  const { avg_pm1, avg_pm25, avg_pm10, status } = sensor;

  if (status !== '1') {
    return false;
  }

  if (avg_pm1 > 80 || avg_pm25 > 80 || avg_pm10 > 80) {
    return false;
  }

  return true;
}

function getGradeForNeighborhood(neighborhoodId) {
  const deviceIdsInNeighborhood = neighborhoods[selectedCityId].find((x) => x.id == neighborhoodId).deviceIds;
  const sensorsInNeighborhood = allSensors.filter((x) => deviceIdsInNeighborhood.includes(x.id)).filter((x) => isAvailable(x));

  if (neighborhoodId == 'grigorescu') {
    console.log('sensorsInNeighborhood', sensorsInNeighborhood);
  }

  if (!sensorsInNeighborhood.length) {
    return '';
  }

  if (!sensorsInNeighborhood.length) {
    return '';
  }

  let summedSensorGrades = 0;

  sensorsInNeighborhood.forEach((sensor) => {
    const { avg_pm1, avg_pm25, avg_pm10 } = sensor;

    const pm1Percentage = (+avg_pm1 / 20) * 10;
    const pm25Percentage = (+avg_pm25 / 25) * 10;
    const pm10Percentage = (+avg_pm10 / 40) * 10;

    const pm1Contribution = 0.2 * pm1Percentage;
    const pm25Contribution = 0.2 * pm25Percentage;
    const pm10Contribution = 0.2 * pm10Percentage;

    const valueForSensor = 10 - (pm1Contribution + pm25Contribution + pm10Contribution);

    summedSensorGrades += valueForSensor;
  });

  const averagedGradeForAllSensors = summedSensorGrades / sensorsInNeighborhood.length;

  return averagedGradeForAllSensors.toFixed(1);
}

function getPmAveragesForNeighborhood(neighborhoodId) {
  const deviceIdsInNeighborhood = neighborhoods[selectedCityId].find((x) => x.id == neighborhoodId).deviceIds;
  const devicesInNeighborhood = allSensors.filter((x) => deviceIdsInNeighborhood.includes(x.id)).filter((x) => isAvailable(x));

  if (neighborhoodId == 'grigorescu') {
    console.log('devicesInNeighborhood', devicesInNeighborhood);
  }

  let averages = {
    pm1: 0,
    pm25: 0,
    pm10: 0,
  };

  devicesInNeighborhood.forEach((sensor) => {
    const { avg_pm1, avg_pm25, avg_pm10 } = sensor;

    averages.pm1 += +avg_pm1;
    averages.pm25 += +avg_pm25;
    averages.pm10 += +avg_pm10;
  });

  return {
    pm1: averages.pm1 / devicesInNeighborhood.length,
    pm25: averages.pm25 / devicesInNeighborhood.length,
    pm10: averages.pm10 / devicesInNeighborhood.length,
  };
}

const neighborhoods = {
  'cluj-napoca': [
    {
      id: 'centru',
      name: 'Centru',
      type: 'Zona',
      imageUrl: 'img/cartiere/centru.jpg',
      deviceIds: ['16000139'],
    },
    {
      id: 'gruia',
      name: 'Gruia',
      imageUrl: 'img/cartiere/gruia.jpg',
      deviceIds: ['16000138'],
    },
    {
      id: 'grigorescu',
      name: 'Grigorescu',
      imageUrl: 'img/cartiere/grigorescu.jpg',
      deviceIds: ['160000C7', '16000067'],
    },
    {
      id: 'plopilor',
      name: 'Plopilor',
      imageUrl: 'img/cartiere/plopilor.jpg',
      deviceIds: ['160000CB'],
    },
    {
      id: 'manastur',
      name: 'Mănăștur',
      deviceIds: ['160000CA'],
      imageUrl: 'img/cartiere/manastur.jpg',
    },
    {
      id: 'bunaziua',
      name: 'Bună Ziua',
      deviceIds: ['160000D3', '160000A2', '160000A5'],
      imageUrl: 'img/cartiere/bunaziua.jpg',
    },
    {
      id: 'europa',
      name: 'Europa',
      deviceIds: ['160000FA', '160000C6', '820001CF'],
      imageUrl: 'img/cartiere/europa.jpg',
    },
    {
      id: 'sopor',
      name: 'Sopor',
      deviceIds: ['16000115'],
      imageUrl: 'img/cartiere/sopor.jpg',
    },
  ],
  dej: [
    {
      id: 'dej',
      type: 'Orașul',
      name: 'Dej',
      deviceIds: ['16000197'],
      imageUrl: 'img/cartiere/dej.jpg',
    },
  ],
  jucu: [
    {
      id: 'jucu',
      type: 'Comuna',
      name: 'Jucu',
      deviceIds: ['160000D0'],
      imageUrl: 'img/cartiere/jucu.jpg',
    },
  ],
  apahida: [
    {
      id: 'apahida',
      type: 'Comuna',
      name: 'Apahida',
      deviceIds: ['160000C9'],
      imageUrl: 'img/cartiere/apahida.jpg',
    },
  ],
};

getAndDisplayData();
setupCityPicker();

function getHtmlForNeighborhood({ id, name, value, type = "Cartierul", imageUrl, pm1, pm25, pm10 }) {
  return `
  <div class="neighborhood" id="${id}" style="background-color: ${getColor(value)}">
    <div class="header">
      ${type}&nbsp;
      <span class="name">${name}</span>
    </div>
    <div class="body">
      <span class="current-value">${value}<span class="max-grade">${pm1 ? '/10' : '...'}</span></span>
      <div class="info" style="display: ${pm1 ? 'block' : 'none'}">
        ${getHtmlForProgressBar({ name: 'PM1.0', value: pm1, legalValue: 20 })}
        ${getHtmlForProgressBar({ name: 'PM2.5', value: pm25, legalValue: 25 })}
        ${getHtmlForProgressBar({ name: 'PM10', value: pm10, legalValue: 40 })}
      </div>
      <div class="gradient"></div>
      <img src="${imageUrl}" alt="${type} ${name}" />
    </div>
  </div>
    `;
}

function getHtmlForProgressBar({ name, value, legalValue }) {
  let percentage = (value / legalValue) * 100;
  if (percentage < 15) {
    percentage = 15;
  }

  return `
    <div class="progress-bar-wrapper">
      <div class="progress-bar">
        <div class="progress" style="background-color: ${getColor(12 - (value / legalValue) * 10)}; width: ${percentage > 100 ? 100 : percentage}%">
          <div class="progress-value">
            ${(value || 0).toFixed(1)}
          </div>
        </div>
      </div>
      <div class="progress-bar-name">
        ${name}
      </div>
      <div class="progress-bar-max-value">/ <b>${legalValue}</b> µg/m³</div>
    </div>
    `;
}

function getColor(value) {
  if (!value) {
    return '';
  }

  if (value >= 9.5) {
    return '#4ac355';
  }
  if (value >= 9.0) {
    return '#71c34a';
  }
  if (value >= 8.5) {
    return '#93c34a';
  }
  if (value >= 7.5) {
    return '#a4c34a';
  }
  if (value >= 7.0) {
    return '#bac34a';
  }
  if (value >= 6.5) {
    return '#c3bb4a';
  }
  if (value >= 6.5) {
    return '#c3aa4a';
  }
  if (value >= 6) {
    return '#c39a4a';
  }
  if (value >= 5.5) {
    return '#c3944a';
  }
  if (value >= 5.0) {
    return '#c3734a';
  }
  if (value >= 4.5) {
    return '#c35c4a';
  }
  if (value >= 4.0) {
    return '#c34a4a';
  }
  if (value >= 3.5) {
    return '#a43434';
  }
  if (value >= 3.0) {
    return '#871f1f';
  }
  if (value >= 2.5) {
    return '#600e0e';
  }
  if (value >= 2.0) {
    return '#3b0404';
  }

  return '#000';
}

function setupCityPicker() {
  document.querySelectorAll('.city-option').forEach((x) => {
    x.addEventListener('click', selectCity);
  });
}

function selectCity(event) {
  const cityId = event.target.id;

  document.querySelectorAll('.city-option').forEach((x) => {
    x.classList.remove('selected');
  });
  document.querySelector('#' + cityId).classList.add('selected');

  selectedCityId = cityId;
  drawNeighborhoods();
  setTimeout(() => {
    getAndPopulateDevices();
  }, 0);
}
