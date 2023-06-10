import axios from 'axios';
import fs from 'fs';
import path from 'path';

function getMarketJSON(marketName, interval = '1d') {
  return JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), 'marketsData', `${marketName}-${interval}.json`)
    )
  );
}

function findInMarket(
  time = 1551661200000,
  market = 'BTCUSDT',
  interval = '1d'
) {
  const json = getMarketJSON(market);
  const current = time;
  const prevDate = new Date(current);
  prevDate.setDate(prevDate.getDate() - 2);
  const nextDate = new Date(current);
  nextDate.setDate(nextDate.getDate() + 2);
  json.forEach(([time]) => {
    if (prevDate.getTime() < time && nextDate.getTime() > time) {
      console.log('file', new Date(time));
    }
  });
  const url = `https://api.binance.com/api/v3/klines?symbol=${market}&interval=${interval}&startTime=${prevDate.getTime()}&endTime=${nextDate.getTime()}`;
  console.log(url);
  axios.get(url).then((response) => {
    response.data.forEach(([time]) => {
      if (prevDate.getTime() < time && nextDate.getTime() > time) {
        console.log('fetch', new Date(time));
      }
    });
  });
}

findInMarket();
