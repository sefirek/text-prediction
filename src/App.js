import logo from './logo.svg';
import './App.css';
import { useSelector } from 'react-redux';
import { useState, useRef } from 'react';
import Workers from './Workers';
import NetworkSelect from './features/NetworkSelect';
import Market from './features/Market';
import MarketDataList from './features/MarketDataList';
import { selectors } from './reducers/marketSlice';
import Chart from './features/Chart';
import WorkerPanel from './features/WorkerPanel';
import './close-jsx-a11y-error';

import RESTFavourite from './reducers/RESTFavourite';

function App() {
  const marketDataSelector = useSelector(selectors.marketDataSelector);
  const marketDownloadingStatusSelector = useSelector(
    selectors.marketDownloadingStatusSelector
  );

  const [chartData, setChartData] = useState([]);
  const [networkJson, setNetworkJson] = useState(null);
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
  const runComulativeTest = async () => {
    const favourites = await RESTFavourite.getFavourites();
    if (!Workers.workers.filter((worker) => worker.isHidden).length) {
      const promises = favourites.map((market, id) => {
        return new Promise(async (resolve, reject)=>{
          const newWorkerId = Workers.getNextId();
          await Workers.createWorker(newWorkerId, true);
          const marketData = marketDataSelector.find((data) => {
            return data.market === market && data.tickInterval === '1d';
          }).data.map(([time, open, high, low, close]) => ({
            time,
            close,
          }));
          // console.log({ marketData });
          await Workers.loadLstmNetworkFromJson(newWorkerId, networkJson);
          await Workers.createLstmDataSet(newWorkerId, {
            marketData,
          });
          const testResult = await Workers.test(newWorkerId);
          resolve({market, testResult, marketData})
          // Workers.terminateWorker(newWorkerId);
        })

      });
      const testResults = await Promise.all(promises);
      const firstTime = findFistCommonTimeOfMarketDatas(testResults);
      const date = new Date(firstTime);
      const now = Date.now();
      const chartDataTimeline = {};
      let time = date.getTime();
      do {
        chartDataTimeline[time]= new Array(favourites.length).fill(null);
        date.setDate(date.getDate() + 1);
        time = date.getTime();
      } while(time < now);
      testResults[0].marketData.forEach(({time, close})=>{
        if(!chartDataTimeline[time]) return;
        chartDataTimeline[time][0] = close;
      })
      const chartData = Object.entries(chartDataTimeline).map(([time, value])=>[new Date(Number.parseInt(time, 10)), ...value]);
    }
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
        <NetworkSelect onSelect={setNetworkJson}></NetworkSelect>
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
        <button onClick={runComulativeTest} hidden={!networkJson}>
          Uruchom zbiorczy test
        </button>
      </header>
    </div>
  );
}

function findFistCommonTimeOfMarketDatas(testResults) {
  return Math.max(...testResults.map(({marketData})=>marketData[0].time))
}

export default App;
