// import axios from '../../node_modules/axios/index.js';
import axios from 'axios';
import Neataptic from './neataptic.js';
import createDataSet from './getDataSet.mjs';

import './init.mjs';
import { Actions, Statuses } from '../Workers.js';
import { getHost } from './config.mjs';
const { architect, methods, Network } = Neataptic;

console.log = globalThis.logFunction;

let inputSize = 31;
let hiddenLayerSize = 15;
let outputSize = inputSize;

const market = 'FETBNB';

const TRAINING_LOOP_MAX_COUNTER = 10;

const dataSet = [];

let networkJson = null;
let network = null;

export async function createLstmDataSet({ value, requestId }) {
  dataSet.length = 0;
  const { marketData } = value;
  try {
    const data = await createDataSet(inputSize, marketData);
    dataSet.push(...data);
    postMessage({
      action: Actions.CREATE_LSTM_DATA_SET,
      value: { status: Statuses.OK, dataSetLength: dataSet.length },
      requestId,
    });
  } catch (e) {
    logFunction('dupa1');
    postMessage({
      action: Actions.CREATE_LSTM_DATA_SET,
      value: { status: Statuses.ERROR, error: e },
      requestId,
    });
  }
}

export default function run({ action, requestId }) {
  logFunction('dSize ' + dataSet.length);
  dataSet.forEach(({ input, output }) => {
    if (input.length !== inputSize || output.length !== outputSize) {
      logFunction({ input, output, inputSize, message: 'error' });
      throw new Error(
        'Niezgodny rozmiar danych wejściowych/wyjściowych\noczekiwany we=' +
          inputSize +
          ' wy=' +
          outputSize +
          '\notrzymano we=' +
          input.length +
          ' wy=' +
          output.length
      );
    }
  });

  // fs.writeFileSync('dataset.json', JSON.stringify(trainingData));
  const TRAINING_DATASET_LENGTH = 100;
  const HALF_DATASET_SIZE = TRAINING_DATASET_LENGTH / 2;
  const startIndex = dataSet.findIndex(
    ({ input }, id) => id > HALF_DATASET_SIZE && input.slice(-2).includes(1)
  );
  logFunction({ startIndex });
  // train(
  //   trainingData.slice(
  //     startIndex - HALF_DATASET_SIZE,
  //     startIndex + HALF_DATASET_SIZE
  //   ),
  //   15
  // );
  postMessage({ action, requestId, value: { status: Statuses.OK } });
  testPredictions(dataSet);
}

export function createNewLstmNetwork({ action, requestId, value }) {
  const network = new architect.LSTM(
    value?.inputSize || inputSize,
    value?.hiddenLayerSize || hiddenLayerSize,
    value?.outputSize || outputSize
  );
  postMessage({
    action,
    requestId,
    value: { status: Statuses.OK, network: network.toJSON() },
  });
  return network;
}

export function loadLstmNetworkFromJson({ action, requestId, value }) {
  if (typeof value !== 'object') {
    postMessage({
      action,
      requestId,
      value: { status: Statuses.ERROR },
    });
    return;
  }
  networkJson = value;
  inputSize = value.input;
  outputSize = value.output;
  network = Network.fromJSON(networkJson);
  postMessage({
    action,
    requestId,
    value: { status: Statuses.OK },
  });
}

function train(trainingData) {
  Math.random.reset();
  logFunction('Number of hidden neurons', hiddenLayerSize);
  const myNetwork = createNewLstmNetwork();
  let batchCount = TRAINING_LOOP_MAX_COUNTER / 2 + 1;
  for (
    let trainingLoopCounter = 0;
    trainingLoopCounter < TRAINING_LOOP_MAX_COUNTER;
    trainingLoopCounter += 1
  ) {
    logFunction(`${(trainingLoopCounter / TRAINING_LOOP_MAX_COUNTER) * 100}%`);

    batchCount -= trainingLoopCounter % 2;
    const trainingOptions = {
      log: 100,
      cost: methods.cost.MSE,
      rate: 0.15 * (1 - trainingLoopCounter / TRAINING_LOOP_MAX_COUNTER),
      iterations: 10000,
      clear: true,
      error: 0.1 / inputSize,
      schedule: {
        function() {
          trainingOptions.kill = true;
        },
        iterations: 5000,
      },
    };

    for (let i = 0; i < batchCount; i += 1) {
      const batchId = i;
      const from = Math.floor((batchId * trainingData.length) / batchCount);
      const to = Math.floor(((batchId + 1) * trainingData.length) / batchCount);
      const dataSet = trainingData.slice(from, to);
      logFunction(
        `${(
          ((trainingLoopCounter + i / batchCount) / TRAINING_LOOP_MAX_COUNTER) *
          100
        ).toFixed(2)}%`
      );
      try {
        myNetwork.train(dataSet, trainingOptions);
      } catch (e) {
        logFunction(dataSet, from, to, trainingData.length);
        throw e;
      }

      if (trainingOptions.kill) break;
    }

    if (trainingOptions.kill) {
      logFunction('Dlugie uczenie, kill');
      testPredictions(trainingData);
      setTimeout(() => {
        hiddenLayerSize += 1;
        train(trainingData);
      }, 100);
      break;
    }

    testPredictions(trainingData);
  }
}

async function testPredictions(testDataSet) {
  const net = Network.fromJSON(networkJson);

  const testResult = testDataSet.reduce(
    (prev, { input, output, close }, id) => {
      const out = net.activate(input);
      const maxOutId = out.reduce((p, c, id) => {
        return c > out[p] ? id : p;
      }, 0);
      prev.indexes.push(maxOutId);
      if (maxOutId < 1 + 1 && id - prev.lastTradingId > 5) {
        if (!prev.buyState) {
          prev.investment = Math.min(50, prev.balance) && prev.balance * 0.3;
          prev.balance -= prev.investment;
          prev.btc = (prev.investment / close) * 0.998;
          prev.buyState = true;
          prev.lastTradingId = id;
          logFunction('buy');
        }
      } else if (
        maxOutId >= inputSize - 1 - 1 &&
        prev.btc !== 0 &&
        id - prev.lastTradingId > 24
      ) {
        if (prev.buyState) {
          prev.balance += prev.btc * close * 0.998;
          prev.btc = 0;
          prev.buyState = false;
          // prev.lastTradingId = id;
          logFunction('sell', prev.balance);
        }
      }
      try {
        net.propagate(0.95, 0, true, output);
      } catch (e) {
        logFunction({ output });
        throw e;
      }

      if (id % 100 === 0) logFunction(id);
      return prev;
    },
    { balance: 100, btc: 0, indexes: [], investment: 0, lastTradingId: 0 }
  );
  testResult.balance += testResult.btc * testDataSet.at(-1).close * 0.998;
  logFunction({ testResult });
}

export function setInputLayerSize({ action, requestId, value }) {
  inputSize = value;
  postMessage({
    action,
    requestId,
    value: { status: Statuses.OK },
  });
}

export function setHiddenLayerSize({ action, requestId, value }) {
  hiddenLayerSize = value;
  postMessage({
    action,
    requestId,
    value: { status: Statuses.OK },
  });
}
