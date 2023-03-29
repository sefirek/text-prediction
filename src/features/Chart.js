import Dygraph from 'dygraphs';
import { useState, useEffect, useRef } from 'react';

let graph = null;

export default function Chart({ data }) {
  const RANGE_STEP = 1000 * 60 * 60;
  const rangeRef = useRef();
  const [minRange, setMinRange] = useState(0);
  const [maxRange, setMaxRange] = useState(0);
  const [disabledRange, setDisabledRange] = useState(true);
  let rangeInput = null;
  let chartData = [];

  const getTimeBoundaries = () => {
    return [
      roundToStep(chartData.at(0)[0].getTime()),
      roundToStep(chartData.at(-1)[0].getTime()),
    ];
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
  const updateZoom = (minTime, maxTime) => {
    if (chartData.length === 0) {
      return;
    }

    const newMinTime = roundToStep(minTime);
    const newMaxTime = roundToStep(maxTime);
    graph.updateOptions({
      dateWindow: [newMinTime, newMaxTime],
    });

    setMinRange(newMinTime);
    setMaxRange(newMaxTime);

    // if (lastLoadedDataLength > 0) {
    //   rangeInput.max = symbolMaxTime - (newMaxTime - newMinTime);
    //   rangeInput.disabled = rangeInput.min === rangeInput.max;
    //   rangeInput.value = newMinTime;
    // } else {
    //   rangeInput.disabled = true;
    // }

    // localStorage.setItem('minDateWindow', newMinTime);
    // localStorage.setItem('maxDateWindow', newMaxTime);
    // localStorage.setItem('showAllData', rangeInput.disabled ? '1' : '');
    // localStorage.setItem(
    //   'moveToLatest',
    //   rangeInput.value === rangeInput.max || rangeInput.disabled ? '1' : ''
    // );
  };
  const roundToStep = (value) => value - (value % RANGE_STEP);

  useEffect(() => {
    chartData = data.map(([time, , , , close]) => [
      new Date(time),
      Number.parseFloat(close),
    ]);
    console.log('update data', chartData);
    if (!graph) {
      graph = new Dygraph(
        'graph',
        (chartData.at(0) && chartData) || [
          [0, 0],
          [1, 1],
        ],
        {
          labels: ['time', 'x'],
          digitsAfterDecimal: 6,
          zoomCallback: updateZoom,
        }
      );
      if (chartData?.length > 0) {
        const [firstTime, lastTime] = getTimeBoundaries();
        setMinRange(firstTime);
        setMaxRange(lastTime);
      }
    } else if (chartData.at(0)) {
      console.log('update file');
      graph.updateOptions({
        file: chartData,
      });

      const [firstTime, lastTime] = getTimeBoundaries();
      setMinRange(firstTime);
      setMaxRange(lastTime);
    }
  }, [data]);

  useEffect(() => {
    if (!rangeInput && rangeRef.current) {
      rangeInput = rangeRef.current;
    }
  });

  useEffect(() => {
    if (chartData.length === 0) {
      return;
    }

    const dateWindow = graph.getOption('dateWindow');
    if (!dateWindow) {
      graph.updateOptions({ dateWindow: [minRange, maxRange] });
    }

    const firstTime = chartData.at(0)[0].getTime();
    const lastTime = chartData.at(-1)[0].getTime();
    const diffTime = lastTime - firstTime;
    const diffRange = maxRange - minRange;
    setDisabledRange(diffTime === diffRange);
  }, [minRange, maxRange]);

  return (
    <div className='graph-container'>
      <div id='graph'></div>
      <div className='range-zoom-container'>
        <input
          ref={rangeRef}
          type='range'
          name='zoom'
          min={minRange}
          max={maxRange}
          step={RANGE_STEP}
          style={{ width: 480 }}
          onChange={updateChart}
          disabled={disabledRange}
        />
      </div>
    </div>
  );
}
