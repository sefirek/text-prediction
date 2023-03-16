import fs from 'fs';
import path from 'path';
import cors from 'cors';
import axios from 'axios';
import express from 'express';
const app = express();
const port = 5000;

app.use(cors());

app.use(express.static(process.cwd() + '/src/webWorker'));
app.use(express.static(process.cwd() + '/public'));
app.use('/network', express.static(process.cwd() + '/networks'));
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.get('/marketData', (req, res) => {
  const market = req.params.market || req.query.market;
  const tickInterval = req.params.tickInterval || req.query.tickInterval;
  const filePath = path.join(process.cwd(), 'marketsData', market + '.json');
  if (fs.existsSync(filePath)) {
    res.send(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
  } else {
    fetchMarketData(market, tickInterval).then((data) => {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      res.send(data);
    });
  }
});

app.get('/network/list', (req, res) => {
  fs.readdir(path.join(process.cwd(), 'networks'), (err, files) => {
    res.send(files);
  });
});

app.get('/isMarketExists', (req, res) => {
  const market = req.params.market || req.query.market;
  isMarketExists(market).then((exists) => res.send(exists));
});

async function isMarketExists(market = 'BTCUSDT') {
  try {
    const response = await axios.get(
      'https://api.binance.com/api/v3/klines?symbol=' +
        market +
        '&interval=1h&limit=1'
    );
    return Array.isArray(response.data);
  } catch (e) {
    return false;
  }
}

async function fetchMarketData(market = 'BTCUSDT', tickInterval = '1h') {
  let date = new Date();

  const times = new Array(50)
    .fill(0)
    .map((value, id) => {
      let endTime = date.getTime();
      switch (tickInterval) {
        case '1h': {
          date.setHours(date.getHours() - 1000);
          break;
        }
        case '5m': {
          date.setMinutes(date.getMinutes() - 5 * 1000);
          break;
        }
        case '1d': {
          date.setDate(date.getDate() - 1000);
          break;
        }
        case '1w': {
          date.setDate(date.getDate() - 7 * 1000);
          break;
        }
        default:
          break;
      }

      let startTime = date.getTime();
      return { startTime, endTime };
    })
    .reverse();
  const promises = times.map(({ startTime, endTime }) => {
    return new Promise(async (res, rej) => {
      const url =
        'https://api.binance.com/api/v3/klines?symbol=' +
        market +
        '&interval=' +
        tickInterval +
        '&startTime=' +
        startTime +
        '&endTime=' +
        endTime +
        '&limit=' +
        1000;
      try {
        const response = await axios.get(url);
        res(response.data);
      } catch (e) {
        rej(e);
      }
    });
  });
  const responses = await Promise.all(promises);
  const response = responses.flat();
  return response;
}
