import { useEffect, useState } from 'react';
import Workers, { getActionName } from '../Workers';
import MarketDataList from './MarketDataList';
import NetworkSelect from './NetworkSelect';
import Switch from './Switch';
import { useSelector } from 'react-redux';
import { selectors } from '../reducers/marketSlice';

export default function WorkerPanel({ id }) {
  const [inputSize, setInputSize] = useState(11);
  const [hiddenNeurons, setHiddenNeurons] = useState(31);
  const [networkJson, setNetworkJson] = useState(null);
  const [selectNewNetwork, setSelectNewNetwork] = useState(false);
  const [market, setMarket] = useState(null);
  const [tickInterval, setTickInterval] = useState(null);
  const marketDataSelector = useSelector(selectors.marketDataSelector);
  const [log, setLog] = useState([]);
  const [trainingProgress, setTrainingProgress] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const actions = Workers.getLogs(id);
      if (actions.length !== log.length) {
        setLog(actions);
      }
      const trainProgress = Workers.getTrainingProgress(id);
      if (trainProgress !== trainingProgress) {
        setTrainingProgress(trainProgress);
      }
    }, 100);
    return () => clearInterval(interval);
  });

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

  function updateInputSize(event) {
    const updatedInputSize = validateValue(event, inputSize);
    if (updateInputSize === inputSize) return;

    Workers.setInputSize(id, updatedInputSize).then(() =>
      setInputSize(updatedInputSize)
    );
  }

  function updateHiddenNeuronSize(event) {
    const updatedHiddenNeuronSize = validateValue(event, hiddenNeurons);
    if (updateHiddenNeuronSize === hiddenNeurons) return;
    setHiddenNeurons(updatedHiddenNeuronSize);
    Workers.setHiddenSize(id, updatedHiddenNeuronSize);
  }

  async function runTest() {
    const marketData = marketDataSelector.find((data) => {
      return data.market === market && data.tickInterval === tickInterval;
    });
    if (!marketData) throw new Error('Nie znaleziono elementu');

    await Workers.loadLstmNetworkFromJson(id, networkJson);

    await Workers.createLstmDataSet(id, {
      marketData: marketData.data.map(([time, open, high, low, close]) => ({
        time,
        close,
      })),
    });
    Workers.test(id);
  }

  async function runTraining() {
    const marketData = marketDataSelector.find((data) => {
      return data.market === market && data.tickInterval === tickInterval;
    });
    if (!marketData) throw new Error('Nie znaleziono elementu');

    // await Workers.loadLstmNetworkFromJson(id, networkJson);

    const networkJson = (await Workers.createNewLstmNetwork(id, {})).value
      .network;
    console.log({ networkJson });
    await Workers.loadLstmNetworkFromJson(id, networkJson);
    setInputSize(networkJson.input);
    await Workers.setInputSize(id, networkJson.input);
    await Workers.createLstmDataSet(id, {
      marketData: marketData.data.map(([time, open, high, low, close]) => ({
        time,
        close,
      })),
    });
    Workers.run(id).then(console.log);
  }

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
            onChange={updateInputSize}
            disabled={!selectNewNetwork}
            style={inputNumberStyle}
          ></input>
        </div>
        <div>
          <span style={{ marginRight: '1rem' }}>Rozmiar warstwy ukrytej</span>
          <input
            value={hiddenNeurons}
            onChange={updateHiddenNeuronSize}
            disabled={!selectNewNetwork}
            style={inputNumberStyle}
          ></input>
        </div>
      </div>
      <span>Wybierz dane:</span>
      <MarketDataList
        selectMarket={({ market, tickInterval }) => {
          setMarket(market);
          setTickInterval(tickInterval);
        }}
      ></MarketDataList>
      <button onClick={runTest} disabled={!market}>
        Uruchom test
      </button>
      <button onClick={runTraining} disabled={!market}>
        Uruchom trening
      </button>
      <p>{trainingProgress}</p>
      <div className='worker-log-container'>
        {log.map((worker, id) => (
          <div key={id}>
            {getActionName(worker.action)} {JSON.stringify(worker.value)}
          </div>
        ))}
      </div>
    </div>
  );
}
