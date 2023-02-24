import axios from 'axios';
import fs from 'fs';
import Neataptic from 'neataptic';
const { architect, methods } = Neataptic;

async function fetchMarketData(market = 'BTCUSDT', tickInterval = '1h') {
  let date = new Date();

  const times = new Array(50)
    .fill(0)
    .map((value, id) => {
      let endTime = date.getTime();
      switch (tickInterval) {
        case '1h': {
          date.setHours(date.getHours() - 1000);
          break;
        }
        case '5m': {
          date.setMinutes(date.getMinutes() - 5 * 1000);
          break;
        }
        default:
          break;
      }

      let startTime = date.getTime();
      return { startTime, endTime };
    })
    .reverse();
  const promises = times.map(({ startTime, endTime }) => {
    return new Promise(async (res, rej) => {
      const url =
        'https://api.binance.com/api/v3/klines?symbol=' +
        market +
        '&interval=' +
        tickInterval +
        '&startTime=' +
        startTime +
        '&endTime=' +
        endTime +
        '&limit=' +
        1000;
      const response = await axios.get(url);
      res(response.data);
    });
  });
  const responses = await Promise.all(promises);
  const response = responses.flat();
  fs.writeFileSync(
    './marketsData/' + market + '.json',
    JSON.stringify(response, null, 2),
    (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    }
  );
}

function getMarketData(market) {
  return JSON.parse(
    fs.readFileSync('./marketsData/' + market + '.json', 'utf-8')
  ).map(([time, open, high, low, close]) => ({ time, close }));
}

function getPercentageRatios(marketData) {
  return marketData.reduce((prev, curr, id) => {
    if (id === 0) {
      prev.push({ ratio: 1, ...curr });
    } else {
      prev.push({
        ratio: curr.close / marketData[id - 1].close,
        ...curr,
      });
    }
    return prev;
  }, []);
}

function getNormalizedData(inputSize, percentageRatios) {
  const sortedPercentageValues = [...percentageRatios].sort(
    (a, b) => a.ratio - b.ratio
  );
  const min =
    sortedPercentageValues[Math.floor(sortedPercentageValues.length * 0.05)]
      .ratio;
  const max =
    sortedPercentageValues[Math.floor(sortedPercentageValues.length * 0.95)]
      .ratio;
  return percentageRatios.map((record, id) => {
    const newValue = (record.ratio - min) / (max - min);
    return { normal: Math.min(Math.max(newValue, 0), 0.95), ...record };
    // if (id === 0) return 0.5;
    // if (x - 1 < 0) {
    //   return Math.min(Math.max((1 - x) / (1 - min) / 2, 0.0001), 0.5);
    // }
    // return Math.min((x - 1) / (max - 1) / 2 + 0.5, 0.9999);
  });
}

export default async function createDataSet(
  inputSize,
  market,
  { from, to, tickInterval } = { tickInterval: '1h' }
) {
  await fetchMarketData(market, tickInterval);
  const marketData = getMarketData(market);
  const ratios = getPercentageRatios(marketData);
  const normalizedData = getNormalizedData(inputSize, ratios);
  fs.writeFileSync(
    'normalizedData.json',
    JSON.stringify(normalizedData, null, 2)
  );
  return normalizedData.map((record, id, arr) => {
    const input = new Array(inputSize).fill(0);
    input[Math.floor(record.normal * inputSize)] = 1;
    const output = new Array(inputSize).fill(0);
    output[Math.floor((arr[id + 1]?.normal || 0.5) * inputSize)] = 1;
    if (
      input.length === inputSize - 1 ||
      output.length === inputSize + 1 ||
      !input.includes(1) ||
      !output.includes(1)
    ) {
      console.log({ input, output, record });
      throw new Error('x');
    }
    return { input, output, ...record };
  });
}
