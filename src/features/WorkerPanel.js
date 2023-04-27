import { useEffect, useState } from 'react';
import Workers from '../Workers';
import MarketDataList from './MarketDataList';
import NetworkSelect from './NetworkSelect';
import Switch from './Switch';

export default function WorkerPanel({ id }) {
  const [inputSize, setInputSize] = useState(11);
  const [hiddenNeurons, setHiddenNeurons] = useState(31);
  const [networkJson, setNetworkJson] = useState(null);
  const [selectNewNetwork, setSelectNewNetwork] = useState(false);

  useEffect(() => {
    Workers.createWorker(id);
    Workers.initializeWorker(id);
  }, [id]);

  useEffect(() => {
    if (!networkJson) return;
    console.log({ networkJson });
    setInputSize(networkJson.input);
    setHiddenNeurons(networkJson.hidden);
  }, [networkJson]);

  const validateValue = (event, prevValue) => {
    const newValue = event.target.value;
    if (Number.parseInt(newValue).toString() === newValue || newValue === '')
      return newValue;
    return prevValue;
  };

  // const marketData = marketDataSelector.find((data) => {
  //   return data.market === 'FETBNB' && data.tickInterval === '1h';
  // });
  // if (!marketData) throw new Error('Nie znaleziono elementu');
  // Workers.createLstmDataSet(0, {
  //   inputSize: networkJson.input, //pobrac z gotowej sieci
  //   marketData: marketData.data.map(([time, open, high, low, close]) => ({
  //     time,
  //     close,
  //   })),
  // }).then((data) => {
  //   console.log('createLstmDataSet', data);
  //   console.log({ networkJson });
  //   Workers.loadLstmNetworkFromJson(0, networkJson).then(() => {
  //     console.log('run');
  //     Workers.run(0);
  //   });
  // });
  const inputNumberStyle = {
    width: '2rem',
  };
  return (
    <div>
      Worker panel {id}
      <Switch title='Nowa sieć' onChange={setSelectNewNetwork}></Switch>
      <NetworkSelect
        onSelect={setNetworkJson}
        disabled={selectNewNetwork}
      ></NetworkSelect>
      <div>
        <div>
          <span style={{ marginRight: '1rem' }}>Rozmiar wejścia</span>
          <input
            value={inputSize}
            onChange={(event) => setInputSize(validateValue(event, inputSize))}
            disabled={!selectNewNetwork}
            style={inputNumberStyle}
          ></input>
        </div>
        <div>
          <span style={{ marginRight: '1rem' }}>Rozmiar warstwy ukrytej</span>
          <input
            value={hiddenNeurons}
            onChange={(event) =>
              setHiddenNeurons(validateValue(event, hiddenNeurons))
            }
            disabled={!selectNewNetwork}
            style={inputNumberStyle}
          ></input>
        </div>
      </div>
      <span>Wybierz dane:</span>
      <MarketDataList></MarketDataList>
    </div>
  );
}
