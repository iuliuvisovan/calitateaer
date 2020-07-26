const neighbourhoods = [
  {
    id: 'grivita',
    name: 'Grivița',
    imageUrl: 'img/cartiere/grivita.png',
    deviceIds: ['160001B2'],
  },
  {
    id: 'garadenord',
    name: 'Gara de Nord',
    imageUrl: 'img/cartiere/garadenord.png',
    deviceIds: ['160001B3'],
  },
  {
    id: 'baneasa',
    name: 'Băneasa',
    imageUrl: 'img/cartiere/baneasa.png',
    deviceIds: ['160001B5'],
  },
  {
    id: 'bucurestiinoi',
    name: 'Bucureștii Noi',
    imageUrl: 'img/cartiere/bucurestiinoi.png',
    deviceIds: ['160001B7'],
  },

];

let allSensors = [];

async function getAndDisplayData() {
  drawNeighborhoods();
  await getAndPopulateSensorList();
  drawNeighborhoods();

  // setInterval(async () => {
  //   await getAndPopulateSensorList();
  //   drawNeighborhoods();
  // }, 20 * 1000);
}

getAndDisplayData();

function drawNeighborhoods() {
  const pageRoot = document.getElementById('root');

  pageRoot.innerHTML = '';

  neighbourhoods
    .forEach(({ id, name, imageUrl }) => {
      const overallGrade = getAirQualityForNeighbourhood(id);

      const { pm1, pm25, pm10 } = getPmAveragesForNeighborhood(id);

      const neighbourhoodHtml = getHtmlForNeighbourhood({ id, name, value: overallGrade, imageUrl, pm1, pm25, pm10 });

      pageRoot.insertAdjacentHTML('beforeend', neighbourhoodHtml);
    });
}

async function getAndPopulateSensorList() {
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
  const devices = await response.json();

  allSensors = devices;
}

function isBroken(sensor) {
  const { avg_pm1, avg_pm25, avg_pm10 } = sensor;

  if (avg_pm1 > 100 || avg_pm25 > 100 || avg_pm10 > 100) {
    return true;
  }
}

function getAirQualityForNeighbourhood(neighbourhoodId) {
  const deviceIdsInNeighbourhood = neighbourhoods.find((x) => x.id == neighbourhoodId).deviceIds;
  const sensorsInNeighbourhood = allSensors.filter((x) => deviceIdsInNeighbourhood.includes(x.id)).filter((x) => !isBroken(x));

  if (!sensorsInNeighbourhood.length) {
    return '';
  }

  if (!sensorsInNeighbourhood.length) {
    return '';
  }

  let summedSensorGrades = 0;

  sensorsInNeighbourhood.forEach((sensor) => {
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

  const averagedGradeForAllSensors = summedSensorGrades / sensorsInNeighbourhood.length;

  return averagedGradeForAllSensors.toFixed(1);
}

function getPmAveragesForNeighborhood(neighbourhoodId) {
  const deviceIdsInNeighbourhood = neighbourhoods.find((x) => x.id == neighbourhoodId).deviceIds;
  const devicesInNeighbourhood = allSensors.filter((x) => deviceIdsInNeighbourhood.includes(x.id)).filter(x => !isBroken(x));

  let averages = {
    pm1: 0,
    pm25: 0,
    pm10: 0,
  };

  devicesInNeighbourhood.forEach((sensor) => {
    const { avg_pm1, avg_pm25, avg_pm10 } = sensor;

    averages.pm1 += +avg_pm1;
    averages.pm25 += +avg_pm25;
    averages.pm10 += +avg_pm10;
  });

  return {
    pm1: averages.pm1 / devicesInNeighbourhood.length,
    pm25: averages.pm25 / devicesInNeighbourhood.length,
    pm10: averages.pm10 / devicesInNeighbourhood.length,
  };
}

function getHtmlForNeighbourhood({ id, name, value, imageUrl, pm1, pm25, pm10 }) {
  return `
  <div class="neighborhood" id="${id}" style="background-color: ${getColor(value)}">
    <div class="header">
      Cartierul&nbsp;
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
      <img src="${imageUrl}" alt="Cartierul ${name}" />
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
