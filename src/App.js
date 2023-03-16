import logo from './logo.svg';
import './App.css';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import Workers from './Workers';
import NetworkSelect from './features/NetworkSelect';
import NetworkSize from './features/NetworkSize';
import Market from './features/Market';
import { selectors } from './reducers/marketSlice';

function App() {
  const marketDataSelector = useSelector(selectors.marketDataSelector);
  const [log, setLog] = useState([]);
  useEffect(() => {
    setInterval(() => {
      const actions = Workers.getLogs(0);
      actions.length && console.log(actions.length);
      if (actions.length) {
        console.log(actions);
        setLog(actions);
        return;
      }

      // actions.length = 0;
    }, 100);
  });
  const createWorker = () => {
    console.log(Workers.createWorker(0));
    Workers.initializeWorker(0).then((data) => {
      console.log('createWorker', data);
      const marketData = marketDataSelector.find((data) => {
        return data.market === 'FETBNB' && data.tickInterval === '1h';
      });
      if (!marketData) throw new Error('Nie znaleziono elementu');
      Workers.createLstmDataSet(0, {
        inputSize: 11,
        marketData: marketData.data.map(([time, open, high, low, close]) => ({
          time,
          close,
        })),
      }).then((data) => {
        console.log('createLstmDataSet', data);
        Workers.createNewLstmNetwork(0, {
          inputSize: 11,
          hiddenNeurons: 31,
          outputSize: 11,
        }).then(() => {
          console.log('run');
          Workers.run(0);
        });
      });

      // Workers.loadLstmNetworkFromServer(
      //   0,
      //   'network-is-11-hn-15-market-FETBNB.json'
      // ).then(console.log);
    });
  };
  return (
    <div className='App'>
      <header className='App-header'>
        <img src={logo} className='App-logo' alt='logo' />
        <Market></Market>
        <NetworkSelect></NetworkSelect>
        <NetworkSize></NetworkSize>
        <button onClick={createWorker}>nowy worker</button>
        {log.map((worker, id) => (
          <div key={id}>
            {worker.action} {JSON.stringify(worker.value)}
          </div>
        ))}
      </header>
    </div>
  );
}

export default App;
