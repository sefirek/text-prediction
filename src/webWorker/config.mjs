let hostName = '';
export function setHost(host) {
  hostName = host.replace('3000', '5000');
}

export function getHost() {
  return hostName;
}
