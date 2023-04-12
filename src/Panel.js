/* eslint-disable prefer-destructuring */
import Dygraph from 'dygraphs';
import React, { useEffect, useState } from 'react';
import SymbolsDatasetReader from '../api/SymbolsDatasetReader';
import Intervals from '../api/Intervals';

const id = localStorage.getItem('socketId') || Math.random();
localStorage.setItem('socketId', id);

// socket.emit('joinRoom', 'ALICEBTC');

// const getAllSymbolsAsync = new Promise((resolve) => {
//   socket.on('getAllSymbols', (allSymbols) => {
//     // setSymbols(allSymbols);
//     socket.emit('joinRoom', allSymbols[0]);
//     resolve(allSymbols);
//   });
// });

// console.log(`socket ${socket.id}`);

let graph = null;
let timeout = null;
let symbolMaxTime = 0;
let lastLoadedDataLength = 0;

const updateZoom = (minTime, maxTime) => {
  const newMinTime = roundToStep(minTime);
  const newMaxTime = roundToStep(maxTime);
  graph.updateOptions({
    dateWindow: [newMinTime, newMaxTime],
  });

  if (lastLoadedDataLength > 0) {
    rangeInput.max = symbolMaxTime - (newMaxTime - newMinTime);
    rangeInput.disabled = rangeInput.min === rangeInput.max;
    rangeInput.value = newMinTime;
  } else {
    rangeInput.disabled = true;
  }

  localStorage.setItem('minDateWindow', newMinTime);
  localStorage.setItem('maxDateWindow', newMaxTime);
  localStorage.setItem('showAllData', rangeInput.disabled ? '1' : '');
  localStorage.setItem(
    'moveToLatest',
    rangeInput.value === rangeInput.max || rangeInput.disabled ? '1' : ''
  );
};
const roundToStep = (value) => value - (value % RANGE_STEP);
let updateGraphFunction = null;
SymbolsDatasetReader.enableLog();
SymbolsDatasetReader.pipe((suppliedSymbols) => {
  // Wait(
  //   () => graph,
  //   () => {
  // console.log('wait done');
  if (timeout) return;
  if (!updateGraphFunction) {
    updateGraphFunction = () => {
      const symbols = Object.keys(suppliedSymbols);
      const maxes = [];
      const mins = [];
      for (let i = 0; i < symbols.length; i += 1) {
        const smbl = symbols[i];

        try {
          const prices = suppliedSymbols[smbl].map(
            (record) => (record && record.close) || null
          );
          maxes.push(Math.max(...prices));
          mins.push(Math.min(...prices));
        } catch (e) {
          console.log({ suppliedSymbols: suppliedSymbols[smbl], symbol: smbl });
          throw e;
        }
      }
      console.log('wait');
      const suppSymbs = suppliedSymbols[symbols.slice(-1)[0]] || [];
      const file = suppSymbs
        .map((record, index) => {
          if (!record) return null;
          const newRecord = [new Date(record.time)];
          for (let i = 0; i < symbols.length; i += 1) {
            if (!suppliedSymbols[symbols[i]][index]) newRecord.push(null);
            else
              newRecord.push(
                (suppliedSymbols[symbols[i]][index].close - mins[i]) /
                  (maxes[i] - mins[i])
              );
          }
          return newRecord;
        })
        .filter((arr) => !!arr);

      graph.updateOptions({
        file,
        labels: ['time', ...symbols],
      });

      lastLoadedDataLength = file.length;
      if (lastLoadedDataLength > 0) {
        const firstTime = file[0][0].getTime();
        const lastTime = file.slice(-1)[0][0].getTime();
        symbolMaxTime = roundToStep(lastTime);
        rangeInput.min = roundToStep(firstTime);

        const dateWindow = graph.getOption('dateWindow');
        if (dateWindow) {
          const [currentMinDateWindow, currentMaxDateWindow] = dateWindow;
          if (rangeInput.value !== rangeInput.max) {
            const minDateWindow = Math.max(firstTime, currentMinDateWindow);
            const maxDateWindow = Math.min(lastTime, currentMaxDateWindow);
            updateZoom(minDateWindow, maxDateWindow);
          } else {
            const minDateWindow = currentMinDateWindow + Intervals['15m'];
            const maxDateWindow = currentMaxDateWindow + Intervals['15m'];
            updateZoom(minDateWindow, maxDateWindow);
          }
        } else if (localStorage.getItem('showAllData')) {
          updateZoom(firstTime, lastTime);
        } else {
          const minDateWindow = Math.max(
            Number.parseInt(localStorage.getItem('minDateWindow'), 10) ||
              firstTime,
            firstTime
          );
          const maxDateWindow = Math.min(
            Number.parseInt(localStorage.getItem('maxDateWindow'), 10) ||
              lastTime,
            lastTime
          );
          if (localStorage.getItem('moveToLatest')) {
            const dateDiff = maxDateWindow - minDateWindow;
            const processedMinDateWindow = symbolMaxTime - dateDiff;
            const processedMaxDateWindow = symbolMaxTime;
            updateZoom(processedMinDateWindow, processedMaxDateWindow);
          } else {
            updateZoom(minDateWindow, maxDateWindow);
          }
        }
      } else {
        rangeInput.min = 0;
        rangeInput.max = 0;
        rangeInput.disabled = true;
      }

      timeout = null;
    };
  }
  timeout = setTimeout(updateGraphFunction, 5000);
});
// });

const RANGE_STEP = 1000 * 60 * 15;
let rangeInput = null;

export default function Panel() {
  const [symbols, setSymbols] = useState([]);

  const ref = React.createRef();
  const rangeRef = React.createRef();

  // const symbolMaxTime = 0;

  if (symbols.length === 0) {
    SymbolsDatasetReader.getAllSymbolsAsync().then((allSymbols) => {
      setSymbols(allSymbols);
      console.log('set symbols');
    });
  }

  useEffect(async () => {
    if (!rangeInput && rangeRef.current) {
      rangeInput = rangeRef.current;
    }

    // const prevMax = rangeRef.current.max;
    // rangeRef.current.max = n;

    // if (n === prevMax) {
    //   rangeRef.current.value = n;
    //   updateChart();
    // }

    // const graphData = data.map(({ time, volume, interval, ...obj }) => {
    //   const result = [time];
    //   labels.forEach((label) => {
    //     if (obj[label] !== undefined) {
    //       if (!label.includes(time)) result.push(obj[label]);
    //     } else if (label.includes('SUPERTREND')) {
    //       if (label.includes('-Buy')) {
    //         const value = obj[label.substring(0, label.length - '-Buy'.length)];
    //         if (value < obj.close) {
    //           result.push(value, null);
    //         } else {
    //           result.push(null, value);
    //         }
    //       }
    //     }
    //   });
    //   result.push(null, null);
    //   return result;
    // });
    // const networkJSON = getNetworkJSON();
    // // .slice(0, 1000);
    // if (networkJSON.history) {
    //   console.log('history', networkJSON.history);
    //   networkJSON.history.forEach(({ timeStart, timeEnd }) => {
    //     const buyData = graphData.find(
    //       (gData) => gData[0].getTime() === new Date(timeStart).getTime()
    //     );
    //     buyData[buyData.length - 2] = buyData[1];
    //     const sellData = graphData.find(
    //       (gData) => gData[0].getTime() === new Date(timeEnd).getTime()
    //     );
    //     sellData[buyData.length - 1] = sellData[1];
    //   });
    // }

    (() => {
      // console.log({ graphData });
      console.log({ ref });
      // Wait(
      //   () => ref.current && rangeRef.current,
      //   () => {
      //     if (graph) return;
      //     const minX = data[0].time.getTime();
      //     const maxX = data.slice(-1)[0].time.getTime();
      //     const newMinX = roundToStep(minX);
      //     const newMaxX = roundToStep(maxX);
      //     const leftX =
      //       roundToStep(Number.parseInt(localStorage.getItem('minDateWindow'), 10)) || newMinX;
      //     const rightX = Math.max(
      //       roundToStep(Number.parseInt(localStorage.getItem('maxDateWindow'), 10)) || newMaxX,
      //       leftX
      //     );
      //     symbolMaxTime = newMaxX;

      //     rangeRef.current.min = newMinX;
      //     rangeRef.current.max = newMaxX - (rightX - leftX);
      //     rangeRef.current.step = RANGE_STEP;
      //     rangeRef.current.value = leftX;

      //     graph = new Dygraph(ref.current, graphData, {
      //       labels,
      //       labelsDiv: 'legend',
      //       labelsSeparateLines: true,
      //       legend: 'always',
      //       digitsAfterDecimal: 5,
      //       dateWindow: [leftX, rightX],
      //       zoomCallback: updateZoom,
      //       series: {
      //         buy: {
      //           color: 'green',
      //           drawPoints: true,
      //           pointSize: 5,
      //         },
      //         sell: {
      //           color: 'red',
      //           drawPoints: true,
      //           pointSize: 2,
      //         },
      //       },
      //     });
      //   }
      // );

      console.log({ graph });
      if (graph === null && ref.current !== null) {
        // const minX = data[0].time.getTime();
        // const maxX = data.slice(-1)[0].time.getTime();
        // const newMinX = roundToStep(minX);
        // const newMaxX = roundToStep(maxX);
        // const leftX =
        //   roundToStep(Number.parseInt(localStorage.getItem('minDateWindow'), 10)) || newMinX;
        // const rightX = Math.max(
        //   roundToStep(Number.parseInt(localStorage.getItem('maxDateWindow'), 10)) || newMaxX,
        //   leftX
        // );
        // symbolMaxTime = newMaxX;

        // rangeRef.current.min = newMinX;
        // rangeRef.current.max = newMaxX - (rightX - leftX);
        // rangeRef.current.step = RANGE_STEP;
        // rangeRef.current.value = leftX;

        graph = new Dygraph(ref.current, [[0]], {
          labels: ['empty'],
          labelsDiv: 'legend',
          labelsSeparateLines: true,
          legend: 'always',
          digitsAfterDecimal: 5,
          // dateWindow: [leftX, rightX],
          zoomCallback: updateZoom,
          series: {
            buy: {
              color: 'green',
              drawPoints: true,
              pointSize: 5,
            },
            sell: {
              color: 'red',
              drawPoints: true,
              pointSize: 2,
            },
          },
        });
      }
    })();
  });

  const updateChart = () => {
    const dateWindow = graph.getOption('dateWindow');
    const newMinTime = roundToStep(dateWindow[0]);
    const newMaxTime = roundToStep(dateWindow[1]);

    const leftX = Number.parseInt(rangeInput.value, 10);
    const rightX = leftX + (newMaxTime - newMinTime);
    graph.updateOptions({
      dateWindow: [leftX, rightX],
    });

    localStorage.setItem('minDateWindow', leftX);
    localStorage.setItem('maxDateWindow', rightX);
    localStorage.setItem(
      'moveToLatest',
      rangeInput.value === rangeInput.max ? '1' : ''
    );
  };

  function updateWithCheckbox(event) {
    const { target } = event;
    if (target.checked) {
      SymbolsDatasetReader.makeSubscriptions([target.value]);
      localStorage.setItem(target.value, '1');
      return;
    }

    try {
      SymbolsDatasetReader.unsubscribe(target.value);
      if (updateGraphFunction) updateGraphFunction();
    } catch (ex) {
      console.log({ ex });
    }
    localStorage.removeItem(target.value);
    delete target.dataset.action;
  }

  initSymbolsWithStorage();
  function initSymbolsWithStorage() {
    const symbolsToSubscribe = symbols.filter((symbol) => {
      const symbolChecked = localStorage.getItem(symbol.name);
      return symbolChecked;
    });
    SymbolsDatasetReader.makeSubscriptions(symbolsToSubscribe);
  }

  console.log({ symbols });
  const checkboxes = symbols.map((symbol) => {
    const symbolChecked = localStorage.getItem(symbol.name);
    return (
      <div key={symbol.id} className='checkbox-container'>
        <input
          type='checkbox'
          name={symbol.name}
          id={symbol.name}
          value={symbol.name}
          defaultChecked={!!symbolChecked && symbol.hasNetwork}
          disabled={!symbol.hasNetwork}
          onChange={updateWithCheckbox}
          data-action={symbolChecked ? 'subscribe' : ''}
        />
        <label htmlFor={symbol.name}>{symbol.name}</label>
      </div>
    );
  });
  return (
    <>
      <div className='symbol-checkboxes'>{checkboxes}</div>
      <div id='legend' style={{ position: 'absolute', left: 480, top: 0 }} />
      <div ref={ref} className='indicators-container' />
      <div
        className='range-zoom-container'
        style={{ width: 430, marginLeft: 50 }}
      >
        <input
          ref={rangeRef}
          type='range'
          name='zoom'
          min='0'
          max='0'
          step={RANGE_STEP}
          style={{ width: '100%' }}
          onChange={updateChart}
          disabled
        />
      </div>
    </>
  );
}

// --------------------------------------------------------

useEffect(async () => {
  if (!rangeInput && rangeRef.current) {
    rangeInput = rangeRef.current;
  }
}); // bez drugiego parametru

let rangeInput = null;
let updateGraphFunction = null;
let lastLoadedDataLength = 0;

new Dygraph(
  ..., {
    zoomCallback: udpateZoom,
  }
);

const updateZoom = (minTime, maxTime) => {
  const newMinTime = roundToStep(minTime);
  const newMaxTime = roundToStep(maxTime);
  graph.updateOptions({
    dateWindow: [newMinTime, newMaxTime],
  });

  if (lastLoadedDataLength > 0) {
    rangeInput.max = symbolMaxTime - (newMaxTime - newMinTime);
    rangeInput.disabled = rangeInput.min === rangeInput.max;
    rangeInput.value = newMinTime;
  } else {
    rangeInput.disabled = true;
  }

  localStorage.setItem('minDateWindow', newMinTime);
  localStorage.setItem('maxDateWindow', newMaxTime);
  localStorage.setItem('showAllData', rangeInput.disabled ? '1' : '');
  localStorage.setItem(
    'moveToLatest',
    rangeInput.value === rangeInput.max || rangeInput.disabled ? '1' : ''
  );
};
const roundToStep = (value) => value - (value % RANGE_STEP);

updateGraphFunction = () => {
  const symbols = Object.keys(suppliedSymbols);
  const maxes = [];
  const mins = [];
  for (let i = 0; i < symbols.length; i += 1) {
    const smbl = symbols[i];

    try {
      const prices = suppliedSymbols[smbl].map(
        (record) => (record && record.close) || null
      );
      maxes.push(Math.max(...prices));
      mins.push(Math.min(...prices));
    } catch (e) {
      console.log({ suppliedSymbols: suppliedSymbols[smbl], symbol: smbl });
      throw e;
    }
  }
  console.log('wait');
  const suppSymbs = suppliedSymbols[symbols.slice(-1)[0]] || [];
  const file = suppSymbs
    .map((record, index) => {
      if (!record) return null;
      const newRecord = [new Date(record.time)];
      for (let i = 0; i < symbols.length; i += 1) {
        if (!suppliedSymbols[symbols[i]][index]) newRecord.push(null);
        else
          newRecord.push(
            (suppliedSymbols[symbols[i]][index].close - mins[i]) /
              (maxes[i] - mins[i])
          );
      }
      return newRecord;
    })
    .filter((arr) => !!arr);

  graph.updateOptions({
    file,
    labels: ['time', ...symbols],
  });

  lastLoadedDataLength = file.length;
  if (lastLoadedDataLength > 0) {
    const firstTime = file[0][0].getTime();
    const lastTime = file.slice(-1)[0][0].getTime();
    symbolMaxTime = roundToStep(lastTime);
    rangeInput.min = roundToStep(firstTime);

    const dateWindow = graph.getOption('dateWindow');
    if (dateWindow) {
      const [currentMinDateWindow, currentMaxDateWindow] = dateWindow;
      if (rangeInput.value !== rangeInput.max) {
        const minDateWindow = Math.max(firstTime, currentMinDateWindow);
        const maxDateWindow = Math.min(lastTime, currentMaxDateWindow);
        updateZoom(minDateWindow, maxDateWindow);
      } else {
        const minDateWindow = currentMinDateWindow + Intervals['15m'];
        const maxDateWindow = currentMaxDateWindow + Intervals['15m'];
        updateZoom(minDateWindow, maxDateWindow);
      }
    } else if (localStorage.getItem('showAllData')) {
      updateZoom(firstTime, lastTime);
    } else {
      const minDateWindow = Math.max(
        Number.parseInt(localStorage.getItem('minDateWindow'), 10) || firstTime,
        firstTime
      );
      const maxDateWindow = Math.min(
        Number.parseInt(localStorage.getItem('maxDateWindow'), 10) || lastTime,
        lastTime
      );
      if (localStorage.getItem('moveToLatest')) {
        const dateDiff = maxDateWindow - minDateWindow;
        const processedMinDateWindow = symbolMaxTime - dateDiff;
        const processedMaxDateWindow = symbolMaxTime;
        updateZoom(processedMinDateWindow, processedMaxDateWindow);
      } else {
        updateZoom(minDateWindow, maxDateWindow);
      }
    }
  } else {
    rangeInput.min = 0;
    rangeInput.max = 0;
    rangeInput.disabled = true;
  }

  timeout = null;
};

const updateChart = () => {
  const dateWindow = graph.getOption('dateWindow');
  const newMinTime = roundToStep(dateWindow[0]);
  const newMaxTime = roundToStep(dateWindow[1]);

  const leftX = Number.parseInt(rangeInput.value, 10);
  const rightX = leftX + (newMaxTime - newMinTime);
  graph.updateOptions({
    dateWindow: [leftX, rightX],
  });

  localStorage.setItem('minDateWindow', leftX);
  localStorage.setItem('maxDateWindow', rightX);
  localStorage.setItem(
    'moveToLatest',
    rangeInput.value === rangeInput.max ? '1' : ''
  );
};

const RANGE_STEP = 1000 * 60 * 15;

return (
  <div className='range-zoom-container'>
    <input
      // ref={rangeRef}
      type='range'
      name='zoom'
      min='0'
      max='0'
      step={RANGE_STEP}
      //style={{ width: '100%' }}
      onChange={updateChart}
      disabled
    />
  </div>
);
