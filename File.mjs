import fs from 'fs';

export default function File(url) {
  this.url = url;
  this.lastFileWriteTime = null;
  this.writeJson = (json) => {
    if (1 || !this.lastFileWriteTime) {
      fs.writeFileSync(url, JSON.stringify(json, null, 2));
      this.lastFileWriteTime = Date.now();
    }
  };
}
