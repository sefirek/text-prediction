import axios from 'axios';
import { getHost } from '../webWorker/config.mjs';

export default async function fetchMarketData(
  market = 'BTCUSDT',
  tickInterval = '1h'
) {
  const response = (
    await axios.get(
      getHost() +
        '/marketData?market=' +
        market +
        '&tickInterval=' +
        tickInterval
    )
  ).data;
  return response;
}
