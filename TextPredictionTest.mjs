import Neataptic from 'neataptic';
const { architect, methods } = Neataptic;
import getText from './getText.mjs';
import './init.mjs';

const inputSize = 1;
const outputSize = 1;

const trainingData = [];
const text = getText().split(' ').slice(0, 10).join(' ');
console.log(text);
let chars = text.split('').reduce((chars, char) => {
  if (!chars.includes(char)) chars.push(char);
  return chars;
}, []);

chars = Object.entries(
  chars.reduce((prev, curr) => {
    prev[curr] ??= 0;
    prev[curr] += text.split(curr).length;
    return prev;
  }, {})
)
  .sort((a, b) => a[1] - b[1])
  .map(([key]) => key)
  .reduce((prev, curr, id) => {
    return id % 2 === 0 ? [curr, ...prev] : [...prev, curr];
  }, []);

console.log({ chars: chars.length });

for (let i = inputSize; i < text.length - outputSize; i += inputSize) {
  const input = text
    .slice(i - inputSize, i)
    .split('')
    .map((char) => {
      const result = new Array(chars.length).fill(0);
      result[chars.indexOf(char)] = 1;
      return result;
    })
    .flat();
  const output = text
    .slice(i, i + outputSize)
    .split('')
    .map((char) => {
      const result = new Array(chars.length).fill(0);
      result[chars.indexOf(char)] = 1;
      return result;
    })
    .flat();
  trainingData.push({
    input,
    output,
  });
}

const TRAINING_LOOP_MAX_COUNTER = 10;
train(37);
function train(hiddenNeurons = (inputSize * chars.length) / 2) {
  console.log('Number of hidden neurons', hiddenNeurons);
  Math.random.reset();
  const myNetwork = new architect.LSTM(
    inputSize * chars.length,
    hiddenNeurons,
    outputSize * chars.length
  );
  let batchCount = TRAINING_LOOP_MAX_COUNTER / 2 + 1;
  for (
    let trainingLoopCounter = 0;
    trainingLoopCounter < TRAINING_LOOP_MAX_COUNTER;
    trainingLoopCounter += 1
  ) {
    console.log(`${(trainingLoopCounter / TRAINING_LOOP_MAX_COUNTER) * 100}%`);

    batchCount -= trainingLoopCounter % 2;
    const trainingOptions = {
      log: 10,
      cost: methods.cost.MSE,
      rate: 0.15 * (1 - trainingLoopCounter / TRAINING_LOOP_MAX_COUNTER),
      iterations: 10000,
      clear: true,
      error: 0.01 / chars.length,
      schedule: {
        function() {
          trainingOptions.kill = true;
        },
        iterations: 300,
      },
      momentum: 0.4,
    };
    const randomBatchIds = new Array(batchCount).fill(0).map((val, id) => id);
    for (let i = 0; i < batchCount; i += 1) {
      const batchId = randomBatchIds[i];
      const dataSet = trainingData.slice(
        Math.floor((batchId * trainingData.length) / batchCount),
        Math.floor(((batchId + 1) * trainingData.length) / batchCount)
      );
      myNetwork.train(dataSet, trainingOptions);
      if (trainingOptions.kill) break;
    }
    console.log(createPredictionText(myNetwork));
    if (trainingOptions.kill) {
      console.log('Long learning, kill learning');
      setTimeout(() => train(hiddenNeurons + 1), 100);
      break;
    }
  }
}

function createPredictionText(myNetwork) {
  myNetwork.clear();
  let result = null;
  const out = trainingData.reduce((prev, { input }) => {
    result = myNetwork.activate(input);
    let maxValueIndex = getMaxValueIndex(result);
    result = new Array(chars.length).fill(0);
    result[maxValueIndex] = 1;
    return prev + chars[maxValueIndex];
  }, chars[getMaxValueIndex(trainingData[0].input)]);

  myNetwork.clear();
  console.log({
    out: new Array(500).fill(0).reduce((prev, curr, id) => {
      if (id < 10) {
        result = trainingData[id].input;
      }
      try {
        result = myNetwork.activate(result);
      } catch (e) {
        console.log({ input: result });
        throw e;
      }

      let maxValueIndex = getMaxValueIndex(result);
      result = new Array(chars.length).fill(0);
      result[maxValueIndex] = 1;
      return prev + chars[maxValueIndex];
    }, chars[getMaxValueIndex(trainingData[0].input)]),
  });
  return out;
}

function getMaxValueIndex(inputArray) {
  return inputArray.reduce((prevIndex, x, id) => {
    return x > inputArray[prevIndex] ? id : prevIndex;
  }, 0);
}
