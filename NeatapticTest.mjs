import Neataptic from 'neataptic';
const { architect, methods } = Neataptic;
import getText from './getText.mjs';

// // Tworzenie warstwy wejściowej
// const inputLayer = new synaptic.Layer(10);

// // Tworzenie warstwy ukrytej
// const hiddenLayer = new synaptic.Layer(100);

// // Tworzenie warstwy wyjściowej
// const outputLayer = new synaptic.Layer(10);

// // Połączenie warstw
// inputLayer.project(hiddenLayer);
// hiddenLayer.project(outputLayer);

// // Tworzenie sieci
// const myNetwork = new synaptic.Network({
//   input: inputLayer,
//   hidden: [hiddenLayer],
//   output: outputLayer,
// });
console.clear();
let prev = 2;
Math.random = () => {
  const x = Math.sin(prev) * 1000;
  prev = x - Math.floor(x);
  return prev;
};

const inputSize = 1;
const outputSize = 1;

// myNetwork.layers.hidden.forEach((neuron) => {
//   neuron.squash = synaptic.Neuron.squash.TANH;
// });

const trainingData = [];
const text = getText().slice(0, 50);
let chars = [];
text.split('').forEach((char) => {
  if (!chars.includes(char)) chars.push(char);
});

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

// process.exit();

const myNetwork = new architect.LSTM(
  inputSize * chars.length,
  inputSize * chars.length,
  outputSize * chars.length
);
// const trainer = new synaptic.Trainer(myNetwork);
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

const TRAINING_LOOP_MAX_COUNTER = 25;
let batchCount = TRAINING_LOOP_MAX_COUNTER / 2 + 1;
for (
  let trainingLoopCounter = 0;
  trainingLoopCounter < TRAINING_LOOP_MAX_COUNTER;
  trainingLoopCounter += 1
) {
  console.log(`${(trainingLoopCounter / TRAINING_LOOP_MAX_COUNTER) * 100}%`);

  batchCount -= trainingLoopCounter % 2;
  for (let i = 0; i < batchCount; i += 1) {
    // console.log({
    //   batchCount,
    //   trainingDataSetLength: trainingData.length,
    //   start: (i * trainingData.length) / batchCount,
    //   stop: ((i + 1) * trainingData.length) / batchCount,
    // });
    // console.log(trainingData);
    const dataSet = trainingData.slice(
      (i * trainingData.length) / batchCount,
      ((i + 1) * trainingData.length) / batchCount
    );
    console.log(dataSet.length);
    myNetwork.train(dataSet, {
      log: 10,
      cost: methods.cost.MSE,
      rate: 0.15 * (1 - trainingLoopCounter / TRAINING_LOOP_MAX_COUNTER),
      iterations: 10000,
      clear: true,
      error: 0.0001,
      // momentum: 0.8,
    });
  }
  console.log(createPredictionText());
}

function createPredictionText() {
  myNetwork.clear();
  const out = trainingData.reduce((prev, { input, output }, id) => {
    const result = myNetwork.activate(input);
    let maxIndex = 0;
    result.forEach((x, id) => {
      if (x > result[maxIndex]) {
        maxIndex = id;
      }
    });

    return prev + chars[maxIndex];
  }, '');
  return out;
}
// myNetwork
//   .evolve(trainingData, {
//     mutation: methods.mutation.FFW,
//     equal: true,
//     popsize: 100,
//     elitism: 10,
//     log: 10,
//     error: 0.03 || 1 / chars.length,
//     iterations: 200,
//     mutationRate: 0.5,
//   })
//   .then(() => {
//     trainingData.forEach(({ input, output }, id) => {
//       const result = myNetwork.activate(input);
//       let maxIndex = 0;
//       result.forEach((x, id) => {
//         if (x > result[maxIndex]) {
//           maxIndex = id;
//         }
//       });

//       console.log(id, chars[maxIndex]);
//     });
//   });
