import Dygraph from 'dygraphs';
import { useState, useEffect, useRef } from 'react';

let graph = null;

export default function Chart({ data }) {
<<<<<<< HEAD
  const RANGE_STEP = 1000 * 60 * 60;
  const rangeRef = useRef();
  const [minRange, setMinRange] = useState(0);
  const [maxRange, setMaxRange] = useState(0);
  const [disabledRange, setDisabledRange] = useState(true);

  const getRefChartData = () => rangeRef?.current.data || [];
=======
  const rangeRef = useRef();
  const [minRange, setMinRange] = useState(0);
  const [maxRange, setMaxRange] = useState(0);
  const [stepRange, setStepRange] = useState(0);
  const [disabledRange, setDisabledRange] = useState(true);
  let rangeInput = null;
  let chartData = [];
>>>>>>> af5b50e4cabd1dcaa66c4b7f5544e6faca5c8b90

  const getTimeBoundaries = () => {
    return [getFirstTime(), getLastTime()];
  };

  const getFirstTime = () => {
    console.log('range ref current data');
    console.log(rangeRef.current.data);
    return roundToStep(rangeRef.current.data.at(0)[0]);
  };
  const getLastTime = () => roundToStep(rangeRef.current.data.at(-1)[0]);

<<<<<<< HEAD
  const updateChart = () => {
=======
  const getFirstTime = () => {
    return roundToStep(rangeRef.current.data.at(0)[0]);
  };
  const getLastTime = () => roundToStep(rangeRef.current.data.at(-1)[0]);

  const updateChart = (event) => {
>>>>>>> af5b50e4cabd1dcaa66c4b7f5544e6faca5c8b90
    const dateWindow = graph.getOption('dateWindow');
    const newMinTime = roundToStep(dateWindow[0]);
    const newMaxTime = roundToStep(dateWindow[1]);

    const leftX = rangeRef.current.valueAsNumber;
    const rightX = leftX + (newMaxTime - newMinTime);
    graph.updateOptions({
      dateWindow: [leftX, rightX],
    });

<<<<<<< HEAD
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
=======
    localStorage.setItem('minDateWindow', leftX);
    localStorage.setItem('maxDateWindow', rightX);
    localStorage.setItem(
      'moveToLatest',
      rangeInput.value === rangeInput.max ? '1' : ''
    );
  };
  const updateZoom = (minTime, maxTime) => {
    if (chartData.length === 0) {
>>>>>>> af5b50e4cabd1dcaa66c4b7f5544e6faca5c8b90
      return;
    }

    const newMinTime = roundToStep(minTime);
    const newMaxTime = roundToStep(maxTime);
    graph.updateOptions({
      dateWindow: [newMinTime, newMaxTime],
    });

<<<<<<< HEAD
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
=======
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
    setInputZoomRangeValue(event.target.valueAsNumber);
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
>>>>>>> af5b50e4cabd1dcaa66c4b7f5544e6faca5c8b90

  useEffect(() => {
    const chartData = data.map(([time, , , , close]) => [
      new Date(time),
      Number.parseFloat(close),
    ]);
<<<<<<< HEAD
    rangeRef.current.data = chartData;
    console.log('length:', chartData.length);
=======
>>>>>>> af5b50e4cabd1dcaa66c4b7f5544e6faca5c8b90
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
<<<<<<< HEAD
      if (chartData?.length > 0) {
        const [firstTime, lastTime] = getTimeBoundaries();
        setMinRange(firstTime);
        setMaxRange(lastTime);
      }
    } else if (chartData.at(0)) {
      console.log('update file');
=======
      return;
    }

    if (chartData.length > 0) {
>>>>>>> af5b50e4cabd1dcaa66c4b7f5544e6faca5c8b90
      graph.updateOptions({
        file: chartData,
      });

<<<<<<< HEAD
      const [firstTime, lastTime] = getTimeBoundaries();
      setMinRange(firstTime);
      setMaxRange(lastTime);
    }
  }, [data]);

  useEffect(() => {
    console.log('min / max');
=======
      const firstTime = chartData[0][0].getTime();
      setMinRange(firstTime);
      setMaxRange(firstTime);
    }

    // TODO: input range na zmianę danych
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
      graph.updateOptions({ dateWindow: getTimeBoundaries() });
    }

    const firstTime = chartData.at(0)[0].getTime();
    const lastTime = chartData.at(-1)[0].getTime();
    const diffTime = lastTime - firstTime;
    const diffRange = maxRange - minRange;
    setDisabledRange(diffTime === diffRange);
  }, [minRange, maxRange]);

  useEffect(() => {
    if (zoomRange.length === 0) {
      return;
    }
>>>>>>> af5b50e4cabd1dcaa66c4b7f5544e6faca5c8b90

    const refChartData = getRefChartData();
    if (refChartData.length === 0) {
      return;
    }

<<<<<<< HEAD
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
=======
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
>>>>>>> af5b50e4cabd1dcaa66c4b7f5544e6faca5c8b90

  return (
    <div className='graph-container'>
      <div id='graph'></div>
      <div className='range-zoom-container'>
        <input
<<<<<<< HEAD
=======
          value={inputZoomRangeValue}
>>>>>>> af5b50e4cabd1dcaa66c4b7f5544e6faca5c8b90
          ref={rangeRef}
          type='range'
          name='zoom'
          min={minRange}
          max={maxRange}
<<<<<<< HEAD
          step={RANGE_STEP}
=======
          step={stepRange}
>>>>>>> af5b50e4cabd1dcaa66c4b7f5544e6faca5c8b90
          style={{ width: 480 }}
          onChange={updateChart}
          disabled={disabledRange}
        />
      </div>
    </div>
  );
}
