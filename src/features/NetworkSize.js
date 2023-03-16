import { useState } from 'react';

export default function NetworkSize() {
  const [inputSize, setInputSize] = useState(11);
  const [hiddenNeurons, setHiddenNeurons] = useState(31);
  const validateValue = (event, prevValue) => {
    const newValue = event.target.value;
    if (Number.parseInt(newValue).toString() === newValue || newValue === '')
      return newValue;
    return prevValue;
  };
  return (
    <div>
      <span>Rozmiar wejścia</span>
      <input
        value={inputSize}
        onChange={(event) => setInputSize(validateValue(event, inputSize))}
      ></input>
      <span>Rozmiar warstwy ukrytej</span>
      <input
        value={hiddenNeurons}
        onChange={(event) =>
          setHiddenNeurons(validateValue(event, hiddenNeurons))
        }
      ></input>
    </div>
  );
}
