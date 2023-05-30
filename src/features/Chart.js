import Dygraph from 'dygraphs';
import { useState, useEffect, useRef } from 'react';

let graph = null;

export default function Chart({ data }) {
  const [minRange, setMinRange] = useState(0);
  const [maxRange, setMaxRange] = useState(0);
  const [stepRange, setStepRange] = useState(0);
  const [zoomRange, setZoomRange] = useState(0);
  const [disabledRange, setDisabledRange] = useState(true);
  const [inputZoomRangeValue, setInputZoomRangeValue] = useState(0);
  let chartData = [];

  const getTimeBoundaries = () => {
    return [getFirstTime(), getLastTime()];
  };

  const getFirstTime = () => {
    return roundToStep(data.at(0)[0]);
  };
  const getLastTime = () => roundToStep(data.at(-1)[0]);

  const updateChart = () => {
    const dateWindow = graph.getOption('dateWindow');
    const newMinTime = roundToStep(dateWindow[0]);
    const newMaxTime = roundToStep(dateWindow[1]);

    const leftX = inputZoomRangeValue;
    const rightX = leftX + (newMaxTime - newMinTime);
    graph.updateOptions({
      dateWindow: [leftX, rightX],
    });

    // localStorage.setItem('minDateWindow', leftX);
    // localStorage.setItem('maxDateWindow', rightX);
    // localStorage.setItem(
    //   'moveToLatest',
    //   rangeRef.current.value === rangeRef.current.max ? '1' : ''
    // );
  };

  const updateZoom = (minTime, maxTime) => {
    setZoomRange([minTime, maxTime]);
  };
  const updateDisabledRange = () => {
    // const [firstTime, lastTime] = getTimeBoundaries();
    // const diffTime = lastTime - firstTime;
    // const diffRange = maxRange - minRange;
    // const shouldBeDisabled = diffTime === diffRange;
    setDisabledRange(minRange === maxRange);

    // setDisabledRange(minRange === maxRange);
  };
  const roundToStep = (value) => value - (value % stepRange);

  useEffect(() => {
    if (data?.length > 1) {
      const [secondToLastData, lastData] = data.slice(-2);
      const marketInterval = lastData[0] - secondToLastData[0];
      setStepRange(marketInterval);
    } else {
      setDisabledRange(true);
    }
  });

  useEffect(() => {
    const chartData = data.map(([time, , , , close]) => [
      new Date(time),
      Number.parseFloat(close),
    ]);
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
      return;
    }

    if (chartData.length > 0) {
      graph.updateOptions({
        file: chartData,
      });

      const [firstTime, lastTime] = getTimeBoundaries();
      setMinRange(firstTime);
      setMaxRange(lastTime);
    }
  }, [data]);

  useEffect(() => {
    if (data.length === 0) {
      return;
    }

    const [minTime, maxTime] = zoomRange;
    const newMinTime = roundToStep(minTime);
    const newMaxTime = roundToStep(maxTime);
    graph.updateOptions({
      dateWindow: [newMinTime, newMaxTime],
    });

    const currentMaxTime = getLastTime() - (newMaxTime - newMinTime);
    setMaxRange(currentMaxTime);
    setInputZoomRangeValue(newMinTime);
    // updateDisabledRange();
    // rangeRef.current.value = newMinTime;

    // setDisabledRange(minRange === currentMaxTime);

    // localStorage.setItem('minDateWindow', newMinTime);
    // localStorage.setItem('maxDateWindow', newMaxTime);
    // localStorage.setItem('showAllData', rangeRef.current.disabled ? '1' : '');
    // localStorage.setItem(
    //   'moveToLatest',
    //   rangeRef.current.value === rangeRef.current.max || rangeRef.current.disabled ? '1' : ''
    // );
  }, [zoomRange]);

  return (
    <div className='graph-container'>
      <div id='graph'></div>
      <div className='range-zoom-container'>
        <input
          value={inputZoomRangeValue}
          type='range'
          name='zoom'
          min={minRange}
          max={maxRange}
          step={stepRange}
          style={{ width: 480 }}
          onChange={updateChart}
          disabled={disabledRange}
        />
      </div>
    </div>
  );
}
