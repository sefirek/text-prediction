import logo from './logo.svg';
import './App.css';
import { useSelector } from 'react-redux';
import { useState, useRef } from 'react';
import Workers from './Workers';
import Market from './features/Market';
import MarketDataList from './features/MarketDataList';
import { selectors } from './reducers/marketSlice';
import Chart from './features/Chart';
import WorkerPanel from './features/WorkerPanel';
import './close-jsx-a11y-error';
import CumulativeTestPanel from './features/CumulativeTestPanel';

function App() {
  const marketDataSelector = useSelector(selectors.marketDataSelector);
  const marketDownloadingStatusSelector = useSelector(
    selectors.marketDownloadingStatusSelector
  );

  const [chartData, setChartData] = useState([]);
  const [workers, setWorkers] = useState([]);
  const imgLogoRef = useRef();

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
        Workers.createNewLstmNetwork(0, {
          inputSize: 11,
          hiddenLayerSize: 31,
          outputSize: 11,
        }).then(() => {
          console.log('run');
          Workers.run(0);
        });
      });
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
          interactive={true}
        ></MarketDataList>
        <CumulativeTestPanel></CumulativeTestPanel>
        <button
          onClick={() => {
            const newId = Workers.getNextId();
            Workers.createWorker(newId);
            setWorkers(Workers.workers.filter((worker) => !worker.isHidden));
          }}
        >
          Dodaj worker
        </button>
        {workers.map(({ id }) => (
          <WorkerPanel key={id} id={id}></WorkerPanel>
        ))}
      </header>
    </div>
  );
}

export default App;
