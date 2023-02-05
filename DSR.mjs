import synaptic from 'synaptic';
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

// myNetwork.layers.hidden.forEach((neuron) => {
//   neuron.squash = synaptic.Neuron.squash.TANH;
// });

const trainingData = [];
const text = getText().slice(0, 140);
let chars = [];
text.split('').forEach((char) => {
  if (!chars.includes(char)) chars.push(char);
});
// chars = chars
//   .map((char) => ({ char, count: text.split(char).length }))
//   .sort((a, b) => -a.count + b.count)
//   .map(({ char }) => char);
console.log(chars);
const myNetwork = new synaptic.Architect.LSTM(
  chars.length,
  chars.length * 1,
  chars.length
);
const trainer = new synaptic.Trainer(myNetwork);
for (let i = inputSize; i < text.length - inputSize; i += inputSize) {
  const input = text
    .slice(i - inputSize, i)
    .split('')
    .map((char) => {
      const result = new Array(chars.length).fill(0);
      result[chars.indexOf(char)] = 1;
      return result;
    })[0];
  const output = text
    .slice(i, i + inputSize)
    .split('')
    .map((char) => {
      const result = new Array(chars.length).fill(0);
      result[chars.indexOf(char)] = 1;
      return result;
    })[0];
  trainingData.push({
    input,
    output,
  });
}

// Uczenie sieci na przykładowych danych
// const trainingData = [
//   {
//     input: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
//     output: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
//   },
//   {
//     input: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
//     output: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
//   },
//   {
//     input: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//     output: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
//   },
// ];

// for (let i = 0; i < 100; i++) {
//   let trainingIndex = Math.floor(i % trainingData.length);
//   if (trainingIndex % 4 === 0) myNetwork.clear();
//   const input = trainingData[trainingIndex].input;
//   // console.log(input);
//   myNetwork.activate(input);
//   myNetwork.propagate(0.9, trainingData[trainingIndex].output);
// }

trainer.train(trainingData, { error: 0.02, iterations: 20 });

// Testowanie sieci na nowych danych
// const testData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
// const result = myNetwork.activate(testData);
// console.log(result);
myNetwork.clear();
trainingData.forEach(({ input, output }) => {
  const result = myNetwork.activate(input);
  let maxIndex = 0;
  result.forEach((x, id) => {
    if (x > result[maxIndex]) {
      maxIndex = id;
    }
  });

  console.log(chars[maxIndex]);
});
console.log('xxxxxxxxxxxxxxxxxxxxxxxx');
myNetwork.clear();
let out = null;
trainingData.forEach(({ input }, id) => {
  out = myNetwork.activate(out && id > 5 ? out : input);
  let maxIndex = 0;
  out.forEach((x, id) => {
    if (x > out[maxIndex]) {
      maxIndex = id;
    }
  });
  console.log(chars[maxIndex]);
});
