import fs from 'fs';
import path from 'path';
import cors from 'cors';
import axios from 'axios';
import express from 'express';
import { exec } from 'child_process';
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(process.cwd() + '/src/webWorker'));
app.use(express.static(process.cwd() + '/public'));
app.use('/network', express.static(process.cwd() + '/networks'));
app.get('/', (req, res) => {
  res.send('Hello World!!');
});

killProcessWithPort(port).then((res) => {
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
}); 

app.get('/marketData', (req, res) => {
  const market = req.params.market || req.query.market;
  const tickInterval = req.params.tickInterval || req.query.tickInterval;
  const columnNames = req.params.columnNames || req.query.columnNames;
  const filePath = path.join(
    process.cwd(),
    'marketsData',
    market + '-' + tickInterval + '.json'
  );
  if (fs.existsSync(filePath)) {
    const marketData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    refactorMarketData(marketData, columnNames)
      .then(res.send.bind(res))
      .catch((e) => res.send(e.message));
  } else {
    fetchMarketData(market, tickInterval).then((marketData) => {
      fs.writeFileSync(filePath, JSON.stringify(marketData, null, 2));
      refactorMarketData(marketData, columnNames)
        .then(res.send.bind(res))
        .catch((e) => res.send(e.message));
    });
  }
});

function killProcessWithPort(port) {
  return new Promise((resolve) => {
    exec(`fuser -k ${port}/tcp`, resolve);
  });
}

const marketColumns = [
  'openTime',
  'open',
  'high',
  'low',
  'close',
  'volume',
  'closeTime',
  'quoteAssetVolume',
  'numOfTrades',
  'takerBuyBaseAssetVolume',
  'takerBuyQuoteAssetVolume',
];

async function refactorMarketData(marketData, columnNames) {
  if (!columnNames)
    return marketData.map((array) => array.map(Number.parseFloat));
  const columns = columnNames.split(',');
  const testColumnNamesErrors = columns.reduce((state, curr) => {
    if (!marketColumns.includes(curr)) {
      state.push(curr);
    }
    return state;
  }, []);
  if (testColumnNamesErrors.length) {
    throw new Error(
      'Invalid columns: ' +
        testColumnNamesErrors.join(', ') +
        '</br>' +
        'Available columns: ' +
        marketColumns.join(', ')
    );
  }
  const indexes = columns.reduce((state, curr) => {
    state.push(marketColumns.indexOf(curr));
    return state;
  }, []);
  return marketData.map((data) => {
    return indexes.reduce((state, curr) => {
      state.push(Number.parseFloat(data[curr]));
      return state;
    }, []);
  });
}

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
  const times = [];
  let endTime = await findOldestTimeOfMarketData(market);
  let startTime = endTime;
  const now = Date.now();
  do {
    startTime = endTime;
    const date = new Date(startTime);
    switch (tickInterval) {
      case '1h': {
        date.setHours(date.getHours() + 1000);
        break;
      }
      case '5m': {
        date.setMinutes(date.getMinutes() + 5 * 1000);
        break;
      }
      case '1d': {
        date.setDate(date.getDate() + 1000);
        break;
      }
      case '1w': {
        date.setDate(date.getDate() + 7 * 1000);
        break;
      }
      default:
        break;
    }
    endTime = date.getTime();
    times.push({ startTime, endTime });
  } while (startTime < now && endTime < now);
  console.log('times', times.length, 'last date', times.at(-1).endTime);
  const promises = times.map(async ({ startTime, endTime }) => {
    if (startTime < 0 || endTime < 0) return Promise.resolve([]);
    const rawData = await fetchPartOfMarketData({
      startTime,
      endTime,
      tickInterval,
      market,
    });
    return rawData.map((record) => record.map(Number.parseFloat));
  });
  const responses = await Promise.all(promises);
  const response = responses.flat();
  return response;
}

async function findOldestTimeOfMarketData(market) {
  const tickInterval = '1w';
  const date = new Date();
  let endTime = date.getTime();
  date.setDate(date.getDate() - 7 * 1000);
  let startTime = date.getTime();
  const promises = [];
  promises.push(
    fetchPartOfMarketData({ startTime, endTime, market, tickInterval })
  );
  endTime = startTime;
  date.setDate(date.getDate() - 7 * 1000);
  startTime = date.getTime();
  promises.push(
    fetchPartOfMarketData({ startTime, endTime, market, tickInterval })
  );
  const marketData = (await Promise.all(promises.reverse())).flat();
  const [firstTime] = marketData.at(0);
  return firstTime;
}

function fetchPartOfMarketData({ startTime, endTime, market, tickInterval }) {
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
    setTimeout(async () => {
      try {
        const response = await axios.get(url);
        res(response.data);
      } catch (e) {
        rej(e);
      }
    }, 10);
  });
}

const FAVOURITES_MARKETS_FILE_PATH = path.join(process.cwd(), 'data/favourites_markets.json');

if(!fs.existsSync(FAVOURITES_MARKETS_FILE_PATH)){
  fs.writeFileSync(FAVOURITES_MARKETS_FILE_PATH, JSON.stringify(['BTCUSDT'], null,2));
}

app.get('/favourite', (req, res)=>{
  res.send(JSON.parse(fs.readFileSync(FAVOURITES_MARKETS_FILE_PATH, 'utf-8')));
});

app.post('/favourite', (req,res)=>{
  const market = req.params.market || req.query.market || req.body?.market;
  console.log({market})
  if(!market) return res.sendStatus(400);
  const markets = JSON.parse(fs.readFileSync(FAVOURITES_MARKETS_FILE_PATH, 'utf-8'));
  if(!markets.includes(market)) {
    markets.push(market);
    fs.writeFileSync(FAVOURITES_MARKETS_FILE_PATH, JSON.stringify(markets, null,2));
  }
  res.send(JSON.parse(fs.readFileSync(FAVOURITES_MARKETS_FILE_PATH, 'utf-8')))
})

app.delete('/favourite', (req, res)=>{
  const market = req.params.market || req.query.market || req.body?.market;
  if(!market) return res.sendStatus(400);
  const markets = JSON.parse(fs.readFileSync(FAVOURITES_MARKETS_FILE_PATH, 'utf-8'));
  markets.splice(markets.indexOf(market),1);
  fs.writeFileSync(FAVOURITES_MARKETS_FILE_PATH, JSON.stringify(markets, null,2));
  res.send(markets);
})