import synaptic from 'synaptic';
const { Architect, Trainer } = synaptic;

const myNetwork = new Architect.Perceptron(2, 6, 1);
myNetwork.layers.output.neurons().forEach((neuron) => {
  // layer.forEach((neuron) => {
  neuron.squash = synaptic.Neuron.squash.TANH;
  // });
});
console.log(Trainer);
const trainer = new Trainer(myNetwork);

const data = [
  { input: [-0.2, -0.2], output: [-0.2] },
  { input: [-0.1, 0.2], output: [0.2] },
  { input: [0.3, -0.3], output: [0.2] },
  { input: [0.4, 0.5], output: [-0.2] },
];

var learningRate = 0.3;

// for (var i = 0; i < 20000; i++) {
//   // 0,0 => 0
//   myNetwork.activate([0, 0]);
//   myNetwork.propagate(learningRate, [0]);

//   // 0,1 => 1
//   myNetwork.activate([0, 1]);
//   myNetwork.propagate(learningRate, [1]);

//   // 1,0 => 1
//   myNetwork.activate([1, 0]);
//   myNetwork.propagate(learningRate, [1]);

//   // 1,1 => 0
//   myNetwork.activate([1, 1]);
//   myNetwork.propagate(learningRate, [0]);
// }

trainer.train(data, { iterations: 2000000, error: 0.000001 });

data.map(({ input, output }) => {
  console.log(output, myNetwork.activate(input));
});
