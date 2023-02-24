import axios from 'axios';
import fs from 'fs';
import Neataptic from 'neataptic';
import createDataSet from './src/binance/getDataSet.mjs';
import './init.mjs';
const { architect, methods, Network } = Neataptic;

const inputSize = 31;
const outputSize = inputSize;

const market = 'FETBNB';

const TRAINING_LOOP_MAX_COUNTER = 10;
createDataSet(inputSize, market).then((trainingData) => {
  trainingData.forEach(({ input, output }) => {
    if (input.length !== inputSize || output.length !== outputSize) {
      console.log({ input, output });
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
  fs.writeFileSync('dataset.json', JSON.stringify(trainingData));
  const TRAINING_DATASET_LENGTH = 100;
  const HALF_DATASET_SIZE = TRAINING_DATASET_LENGTH / 2;
  const startIndex = trainingData.findIndex(
    ({ input }, id) => id > HALF_DATASET_SIZE && input.slice(-2).includes(1)
  );
  console.log({ startIndex });
  train(
    trainingData.slice(
      startIndex - HALF_DATASET_SIZE,
      startIndex + HALF_DATASET_SIZE
    ),
    15
  );
  testPredictions(trainingData, 15);
});

function train(trainingData, hiddenNeurons = inputSize) {
  Math.random.reset();
  console.log('Number of hidden neurons', hiddenNeurons);
  const myNetwork = new architect.LSTM(inputSize, hiddenNeurons, outputSize);
  let batchCount = TRAINING_LOOP_MAX_COUNTER / 2 + 1;
  for (
    let trainingLoopCounter = 0;
    trainingLoopCounter < TRAINING_LOOP_MAX_COUNTER;
    trainingLoopCounter += 1
  ) {
    console.log(`${(trainingLoopCounter / TRAINING_LOOP_MAX_COUNTER) * 100}%`);

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

    fs.writeFileSync(
      process.cwd() +
        '/networks/network' +
        '-is-' +
        inputSize +
        '-hn-' +
        hiddenNeurons +
        '-market-' +
        market +
        '.json',
      JSON.stringify(myNetwork.toJSON(), null, 2)
    );

    for (let i = 0; i < batchCount; i += 1) {
      const batchId = i;
      const from = Math.floor((batchId * trainingData.length) / batchCount);
      const to = Math.floor(((batchId + 1) * trainingData.length) / batchCount);
      const dataSet = trainingData.slice(from, to);
      console.log(
        `${(
          ((trainingLoopCounter + i / batchCount) / TRAINING_LOOP_MAX_COUNTER) *
          100
        ).toFixed(2)}%`
      );
      try {
        myNetwork.train(dataSet, trainingOptions);
      } catch (e) {
        console.log(dataSet, from, to, trainingData.length);
        throw e;
      }

      if (trainingOptions.kill) break;
    }

    if (trainingOptions.kill) {
      console.log('Dlugie uczenie, kill');
      testPredictions(trainingData, hiddenNeurons);
      setTimeout(() => train(trainingData, hiddenNeurons + 1), 100);
      break;
    }
    fs.writeFileSync(
      process.cwd() +
        '/networks/network' +
        '-is-' +
        inputSize +
        '-hn-' +
        hiddenNeurons +
        '-market-' +
        market +
        '.json',
      JSON.stringify(myNetwork.toJSON(), null, 2)
    );
    testPredictions(trainingData, hiddenNeurons);
  }
}

function testPredictions(testDataSet, hiddenNeurons) {
  const net = Network.fromJSON(
    JSON.parse(
      fs.readFileSync(
        process.cwd() +
          '/networks/network-is-' +
          inputSize +
          '-hn-' +
          hiddenNeurons +
          '-market-' +
          market +
          '.json',
        'utf-8'
      )
    )
  );
  createDataSet(inputSize, market, { from: 0, tickInterval: '5m' }).then(
    (trainingData) => {
      const testResult = trainingData.reduce(
        (prev, { input, output, close }) => {
          const out = net.activate(input);
          const maxOutId = out.reduce((p, c, id) => {
            return c > out[p] ? id : p;
          }, 0);
          prev.indexes.push(maxOutId);
          if (maxOutId < 1 + 1) {
            if (!prev.buyState) {
              prev.investment = 10;
              prev.balance -= prev.investment;
              prev.btc = (prev.investment / close) * 0.998;
              prev.buyState = true;
              console.log('buy');
            }
          } else if (maxOutId >= inputSize - 1 - 1 && prev.btc !== 0) {
            if (prev.buyState) {
              prev.balance += prev.btc * close * 0.998;
              prev.buyState = false;
              console.log('sell', prev.balance);
            }
          }
          net.propagate(0.15, 0, true, output);
          return prev;
        },
        { balance: 100, btc: 0, indexes: [], investment: 0 }
      );
      testResult.balance = testResult.btc * trainingData.at(-1).close * 0.998;
      // console.log({ testResult });
      fs.writeFileSync(
        'learningresult.json',
        JSON.stringify(testResult, null, 2)
      );
    }
  );
}

// console.log([0,1,2,3,4,5,6,7,8,9].slice(-5,-1))
