import { useSelector } from 'react-redux';
import Workers from '../Workers';
import RESTFavourite from '../reducers/RESTFavourite';
import NetworkSelect from './NetworkSelect';
import { useEffect, useState } from 'react';
import { selectors } from '../reducers/marketSlice';
import Dygraph from 'dygraphs';

let graph = null;

export default function CumulativeTestPanel() {
  const marketDataSelector = useSelector(selectors.marketDataSelector);
  const [networkJson, setNetworkJson] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!graph) {
      RESTFavourite.getFavourites().then((favourites) => {
        const labels = [
          'time',
          ...favourites.map((market) => `${market}-buy`),
          ...favourites.map((market) => `${market}-sell`),
        ];
        const chartDataExample = [labels.map(() => 0)];
        graph = new Dygraph('cumulativeTestChart', chartDataExample, {
          labels,
          digitsAfterDecimal: 6,
        });
      });
    }

    if (chartData.length > 0) {
      console.log(chartData);
      graph.updateOptions({
        file: chartData,
      });
    }
  }, [chartData]);

  const runComulativeTest = async () => {
    const favourites = await RESTFavourite.getFavourites();
    if (!Workers.workers.filter((worker) => worker.isHidden).length) {
      const promises = favourites.map((market, id) => {
        return new Promise(async (resolve, reject) => {
          const workerId = Workers.getNextId();
          await Workers.createWorker(workerId, true);
          const marketData = marketDataSelector
            .find((data) => {
              return data.market === market && data.tickInterval === '1d';
            })
            .data.map(([time, open, high, low, close]) => ({
              time,
              close,
            }));
          await Workers.loadLstmNetworkFromJson(workerId, networkJson);
          await Workers.createLstmDataSet(workerId, {
            marketData,
          });
          const testResult = await Workers.test(workerId);
          resolve({ market, testResult, marketData });
          // Workers.terminateWorker(newWorkerId);
        });
      });
      const testResults = await Promise.all(promises);
      const firstTime = findFistCommonTimeOfMarketDatas(testResults);
      const date = new Date(firstTime);
      date.setHours(0);
      const now = Date.now();
      const chartDataTimeline = {};
      let time = date.getTime();
      do {
        chartDataTimeline[time] = new Array(favourites.length * 2).fill(null);
        date.setDate(date.getDate() + 1);
        time = date.getTime();
      } while (time < now);
      testResults.forEach((testResult, id) =>
        testResult.marketData.forEach(({ time, close }) => {
          const d = new Date(time);
          d.setHours(0);
          if (!chartDataTimeline[d.getTime()]) return;
          chartDataTimeline[d.getTime()][id] = close;
        })
      );
      // data normalization
      const minMaxs = new Array(favourites.length)
        .fill(null)
        .map((value, id) => {
          const min = testResults[id].marketData[0].close;
          const max = min;
          if (!Number.isFinite(min)) {
            throw new Error('x');
          }
          return { min, max };
        });
      Object.values(chartDataTimeline).forEach((array) => {
        minMaxs.forEach((minMax, id) => {
          minMax.min = Math.min(array[id], minMax.min);
          minMax.max = Math.max(array[id], minMax.max);
        });
      });
      Object.values(chartDataTimeline).forEach((array) => {
        for (let id = 0; id < array.length / 2; id += 1) {
          const { min, max } = minMaxs[id];
          array[id] = (array[id] - min) / (max - min);
        }
      });
      const chartData = Object.entries(chartDataTimeline).map(
        ([time, value]) => [new Date(Number.parseFloat(time)), ...value]
      );
      console.log(testResults[0].testResult);
      setChartData(chartData);
    }
  };

  return (
    <div>
      <NetworkSelect onSelect={setNetworkJson}></NetworkSelect>
      <div id='cumulativeTestChart'></div>
      <button onClick={runComulativeTest} hidden={!networkJson}>
        Uruchom zbiorczy test
      </button>
    </div>
  );
}

function findFistCommonTimeOfMarketDatas(testResults) {
  return Math.max(...testResults.map(({ marketData }) => marketData[0].time));
}
