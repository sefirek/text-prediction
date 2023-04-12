import Dygraph from 'dygraphs';
import { useState, useEffect, useRef } from 'react';

let graph = null;

export default function Chart({ data }) {
  const RANGE_STEP = 1000 * 60 * 60;
  const rangeRef = useRef();
  const [minRange, setMinRange] = useState(0);
  const [maxRange, setMaxRange] = useState(0);
  const [disabledRange, setDisabledRange] = useState(true);

  const getRefChartData = () => rangeRef?.current.data || [];

  const getTimeBoundaries = () => {
    return [getFirstTime(), getLastTime()];
  };

  const getFirstTime = () => {
    console.log('range ref current data');
    console.log(rangeRef.current.data);
    return roundToStep(rangeRef.current.data.at(0)[0]);
  };
  const getLastTime = () => roundToStep(rangeRef.current.data.at(-1)[0]);

  const updateChart = () => {
    const dateWindow = graph.getOption('dateWindow');
    const newMinTime = roundToStep(dateWindow[0]);
    const newMaxTime = roundToStep(dateWindow[1]);

    const leftX = rangeRef.current.valueAsNumber;
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
    const refChartData = getRefChartData();
    if (refChartData.length === 0) {
      return;
    }

    const newMinTime = roundToStep(minTime);
    const newMaxTime = roundToStep(maxTime);
    graph.updateOptions({
      dateWindow: [newMinTime, newMaxTime],
    });

    const currentMaxTime = getLastTime() - (newMaxTime - newMinTime);
    setMaxRange(currentMaxTime);

    console.log({ minRange, currentMaxTime }, minRange === currentMaxTime);
    setDisabledRange(minRange === currentMaxTime);
    rangeRef.current.value = newMinTime;

    // localStorage.setItem('minDateWindow', newMinTime);
    // localStorage.setItem('maxDateWindow', newMaxTime);
    // localStorage.setItem('showAllData', rangeRef.current.disabled ? '1' : '');
    // localStorage.setItem(
    //   'moveToLatest',
    //   rangeRef.current.value === rangeRef.current.max || rangeRef.current.disabled ? '1' : ''
    // );
  };
  const roundToStep = (value) => value - (value % RANGE_STEP);

  useEffect(() => {
    const chartData = data.map(([time, , , , close]) => [
      new Date(time),
      Number.parseFloat(close),
    ]);
    rangeRef.current.data = chartData;
    console.log('length:', chartData.length);
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
    console.log('min / max');

    const refChartData = getRefChartData();
    if (refChartData.length === 0) {
      return;
    }

    const dateWindow = graph.getOption('dateWindow');
    if (!dateWindow) {
      graph.updateOptions({ dateWindow: [minRange, maxRange] });
    }

    const [firstTime, lastTime] = getTimeBoundaries();
    const diffTime = lastTime - firstTime;
    const diffRange = maxRange - minRange;
    const shouldBeDisabled = diffTime === diffRange;
    setDisabledRange(shouldBeDisabled);
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
