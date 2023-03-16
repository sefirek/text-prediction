import axios from 'axios';
import { getHost } from './config.mjs';
import Neataptic from './neataptic.js';
const { architect, methods, Network } = Neataptic;

async function fetchMarketData(market = 'BTCUSDT', tickInterval = '1h') {
  const response = (
    await axios.get(
      getHost() +
        '/marketData?market=' +
        market +
        '&tickInterval=' +
        tickInterval
    )
  ).data;
  return response;
}

async function getMarketData(market, tickInterval) {
  const data = await fetchMarketData(market, tickInterval);
  return (typeof data === 'string' ? JSON.parse(data) : data).map(
    ([time, open, high, low, close]) => ({
      time,
      close,
    })
  );
}

function getPercentageRatios(marketData, shift = 1) {
  return marketData.reduce((prev, curr, id) => {
    if (id === 0) {
      prev.push({ ratio: 1, ...curr });
    } else {
      prev.push({
        ratio: marketData[id - shift]
          ? curr.close / marketData[id - shift].close
          : 1,
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
  });
}

export default async function createDataSet(inputSize, marketData) {
  const ratios = getPercentageRatios(marketData);
  const normalizedData = getNormalizedData(inputSize, ratios);

  return normalizedData.map((record, id, arr) => {
    const input = new Array(inputSize).fill(0);
    input[Math.floor(record.normal * inputSize)] = 1;
    if (!Number.isFinite(Math.floor(record.normal * inputSize))) {
      logFunction({ record });
      throw new Error('NAN ');
    }
    const output = new Array(inputSize).fill(0);
    output[Math.floor((arr[id + 1]?.normal || 0.5) * inputSize)] = 1;
    if (
      input.length === inputSize - 1 ||
      output.length === inputSize + 1 ||
      !input.includes(1) ||
      !output.includes(1)
    ) {
      logFunction({ input, output, record });
      throw new Error('xxxx \n' + JSON.stringify({ record }));
    }
    return { ...record, input, output };
  });
}

export async function createLstmDataSet(inputSize, marketData) {
  return createDataSet(inputSize, marketData);
}

export async function createPerceptronDataSet(
  inputSize,
  market,
  { tickInterval } = { tickInterval: '1h' },
  lstmNetworkJSON
) {
  const marketData = await getMarketData(market, tickInterval);
  const inputRatios = getPercentageRatios(marketData);
  const normalizedInputData = getNormalizedData(inputSize, inputRatios);
  const outputRatios = getPercentageRatios(marketData, -5);
  const normalizedOutputData = getNormalizedData(inputSize, outputRatios);

  const result = normalizedInputData.map((record, id, arr) => {
    const net = Network.fromJSON(lstmNetworkJSON);
    const perceptronInput = [];
    let prevOutput = normalizedInputData
      .slice(id < 10 ? 0 : id - 10 + 1, id + 1)
      .reduce((prev, record, id) => {
        const input = new Array(inputSize).fill(0);
        input[Math.floor(record.normal * inputSize)] = 1;
        const output = new Array(inputSize).fill(0);
        output[
          Math.floor((normalizedInputData[id + 1]?.normal || 0.5) * inputSize)
        ] = 1;
        prev = new Array(inputSize).fill(0);
        prev[getMaxId(net.activate(input))] = 1;
        net.propagate(0.95, 0, true, output);
        return prev;
      }, []);
    perceptronInput.push(getMaxId(prevOutput) / inputSize);
    new Array(4).fill(0).forEach(() => {
      const input = prevOutput;
      const output = new Array(inputSize).fill(0);
      const outputMaxId = getMaxId(net.activate(input));
      output[outputMaxId] = 1;
      prevOutput = output;
      net.propagate(0.95, 0, true, output);
      perceptronInput.push(outputMaxId / inputSize);
    });
    const perceptronOutput = new Array(inputSize).fill(0);
    perceptronOutput[
      Math.floor((normalizedOutputData[id]?.normal || 0.5) * inputSize)
    ] = 1;
    logFunction('' + (id / normalizedInputData.length).toFixed(3) + '%');
    // if (!perceptronInput.includes(1) || !perceptronOutput.includes(1)) {
    //   logFunction({ perceptronOutput, perceptronInput });
    //   throw new Error('create perceptron dataset');
    // }
    // logFunction(
    //   JSON.stringify({
    //     input: perceptronInput,
    //     output: perceptronOutput,
    //     ...record,
    //   })
    // );
    return { ...record, input: perceptronInput, output: perceptronOutput };
  });

  return result;
}

function getMaxId(array) {
  return array.reduce((prev, value, id) => {
    return value > array[prev] ? id : prev;
  }, 0);
}
