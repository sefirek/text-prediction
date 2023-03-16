const worker = new Worker('worker.bundle.js', { type: 'module' });

worker.onmessage = (event) => {
  // console.log('onmessage');
  // console.log({ event });
  // console.log(event.data);
  document.body.innerHTML = event.data + '<br>' + document.body.innerHTML;
};

worker.postMessage('Hi');
