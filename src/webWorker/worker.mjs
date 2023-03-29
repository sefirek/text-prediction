import run, {
  createLstmDataSet,
  createNewLstmNetwork,
  loadLstmNetworkFromJson,
} from './MarketPricePredictionTest.mjs';
import { Actions } from '../Workers.js';
import { setHost } from './config.mjs';
const logFunction = (...args) =>
  postMessage({ action: Actions.LOG, value: args });
Object.assign(globalThis, { logFunction });

onmessage = function (event) {
  try {
    // logFunction('aaabbb');
    const { action, value, requestId } = event.data;
    logFunction({ action, requestId });
    switch (action) {
      case Actions.INITIALIZE: {
        setHost(value.host);
        postMessage({
          action,
          value: { status: 'ok' },
          requestId,
        });
        break;
      }
      case Actions.RUN: {
        logFunction('jest');
        run(event.data);
        break;
      }
      case Actions.CREATE_LSTM_DATA_SET: {
        createLstmDataSet(event.data);
        break;
      }
      case Actions.CREATE_NEW_LSTM_NETWORK: {
        createNewLstmNetwork(event.data);
        break;
      }
      case Actions.LOAD_LSTM_NETWORK_FROM_JSON: {
        loadLstmNetworkFromJson(event.data);
        break;
      }
      default: {
        logFunction('Unkown action');
      }
    }
    // postMessage('aaa');
  } catch (e) {
    postMessage({ error: e.message });
  }
};
