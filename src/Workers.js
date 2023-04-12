function Workers() {
  /**
   * @type {{id:Number,action:[{action:0}],worker:Worker}}
   */
  this.workers = [];

  this.getNextId = () => {
    return (
      this.workers.reduce((max, worker) => {
        return Math.max(max, worker.id);
      }, -1) + 1
    );
  };

  this.createWorker = (workerId) => {
    if (this.workers[workerId]) return false;
    const worker = new Worker('worker.bundle.js');
    const workerState = {
      id: workerId,
      actions: [],
      worker,
      callbacks: {},
      requestId: 0,
      state: 'stop',
      isInit: false,
    };
    this.workers[workerId] = workerState;
    worker.onmessage = ({ data }) => {
      const { requestId, value } = data;
      const { callbacks } = workerState;
      if (callbacks[requestId]) {
        if (value.status === 'ok') {
          callbacks[requestId].resolve(data);
        } else {
          callbacks[requestId].reject(data);
        }

        delete callbacks[requestId];
        return;
      }
      workerState.actions.push(data);
    };
    this.initializeWorker(workerId)
      .then((data) => console.log('worker', workerId, 'initialized'))
      .catch((data) => console.log('worker', workerId, 'error', data));
    return true;
  };
  this.run = (workerId) => {
    if (this.workers[workerId].state === 'stop') {
      this.workers[workerId].state = 'start';
      return this.sendRequest(workerId, {
        action: Actions.RUN,
        value: {},
      });
    }
  };
  this.initializeWorker = (workerId) => {
    const worker = this.workers[workerId];
    if (worker.isInit === false) {
      worker.isInit = true;
      return this.sendRequest(workerId, {
        action: Actions.INITIALIZE,
        value: { host: window.location.origin },
      });
    }
    return Promise.resolve({
      action: Actions.INITIALIZE,
      value: { status: 'ok' },
    });
  };
  this.createLstmDataSet = (workerId, { inputSize, marketData } = {}) => {
    console.log(marketData);
    return this.sendRequest(workerId, {
      action: Actions.CREATE_LSTM_DATA_SET,
      value: { inputSize, marketData },
    });
  };
  this.getLogs = (workerId) => {
    const logs = [...(this.workers[workerId]?.actions || [])];
    // logs.length && (this.workers[workerId].actions.length = 0);
    return logs;
  };
  this.sendRequest = (workerId, { action, value }) => {
    const worker = this.workers[workerId];
    return new Promise((resolve, reject) => {
      worker.callbacks[worker.requestId] = { resolve, reject };
      worker.worker.postMessage({ action, value, requestId: worker.requestId });
      worker.requestId += 1;
    });
  };
  this.createNewLstmNetwork = (
    workerId,

    { inputSize = 11, hiddenNeurons = 11, outputSize = 11 }
  ) => {
    return this.sendRequest(workerId, {
      action: Actions.CREATE_NEW_LSTM_NETWORK,
      value: { inputSize, hiddenNeurons, outputSize },
    });
  };
  this.loadLstmNetworkFromJson = (workerId, networkJson) => {
    return this.sendRequest(workerId, {
      action: Actions.LOAD_LSTM_NETWORK_FROM_JSON,
      value: networkJson,
    });
  };
}

export const Actions = {
  LOG: 0,
  CREATE_LSTM_DATA_SET: 1,
  RUN: 2,
  INITIALIZE: 3,
  CREATE_NEW_LSTM_NETWORK: 4,
  LOAD_LSTM_NETWORK_FROM_JSON: 5,
};

export default new Workers();
