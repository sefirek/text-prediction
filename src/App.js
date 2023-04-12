import logo from './logo.svg';
import './App.css';
import { useSelector } from 'react-redux';
import { useEffect, useState, useRef } from 'react';
import Workers from './Workers';
import NetworkSelect from './features/NetworkSelect';
import NetworkSize from './features/NetworkSize';
import Market from './features/Market';
import MarketDataList from './features/MarketDataList';
import { selectors } from './reducers/marketSlice';
import Chart from './features/Chart';
import WorkerPanel from './features/WorkerPanel';
import './close-jsx-a11y-error';

function App() {
  const marketDataSelector = useSelector(selectors.marketDataSelector);
  const marketDownloadingStatusSelector = useSelector(
    selectors.marketDownloadingStatusSelector
  );
  const [chartData, setChartData] = useState([]);
  const [networkJson, setNetworkJson] = useState(null);
  const [log, setLog] = useState([]);
  const imgLogoRef = useRef();
  const workerLogContainerRef = useRef();

  useEffect(() => {
    setInterval(() => {
      const actions = Workers.getLogs(0);
      // actions.length && console.log(actions.length);
      if (actions.length) {
        // console.log(actions);
        setLog(actions);
        return;
      }

      // actions.length = 0;
    }, 100);
    console.log('xxxxxxxxxxxxxxxxxxxx');
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
  const testWorker = () => {
    console.log(Workers.createWorker(0));
    Workers.initializeWorker(0).then((data) => {
      console.log('createWorker', data);
      const marketData = marketDataSelector.find((data) => {
        return data.market === 'FETBNB' && data.tickInterval === '1h';
      });
      if (!marketData) throw new Error('Nie znaleziono elementu');
      Workers.createLstmDataSet(0, {
        inputSize: networkJson.input, //pobrac z gotowej sieci
        marketData: marketData.data.map(([time, open, high, low, close]) => ({
          time,
          close,
        })),
      }).then((data) => {
        console.log('createLstmDataSet', data);
        console.log({ networkJson });
        Workers.loadLstmNetworkFromJson(0, networkJson).then(() => {
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
        <img
          src={logo}
          className='App-logo'
          alt='logo'
          style={{
            animationPlayState:
              marketDownloadingStatusSelector === 'pending'
                ? 'running'
                : 'paused',
          }}
          ref={imgLogoRef}
        />
        <Chart data={chartData}></Chart>
        <Market></Market>
        <MarketDataList
          selectMarket={({ market, tickInterval }) => {
            const data = marketDataSelector.find((data) => {
              return (
                data.market === market && data.tickInterval === tickInterval
              );
            }).data;
            console.log('select', data);
            setChartData(data);
          }}
        ></MarketDataList>
        <NetworkSelect onSelect={setNetworkJson}></NetworkSelect>
        {/* <NetworkSize></NetworkSize> */}
        {/* <button onClick={createWorker}>nowy worker</button> */}
        <button
          onClick={() => {
            const newId = Workers.getNextId();
            Workers.createWorker(newId);
            Workers.initializeWorker(newId);
          }}
        >
          Dodaj worker
        </button>
        {Workers.workers.map(({ id }) => (
          <WorkerPanel key={id} id={id}></WorkerPanel>
        ))}
        <button onClick={testWorker} hidden={!networkJson}>
          test worker
        </button>
      </header>
      <div className='worker-log-container' ref={workerLogContainerRef}>
        {log.map((worker, id) => (
          <div key={id}>
            {worker.action} {JSON.stringify(worker.value)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
