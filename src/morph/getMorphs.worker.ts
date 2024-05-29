import { getMorphs } from './../morph/getMorphs';

self.onmessage = ((msg: any) => {
    const morphs =  getMorphs(msg.data)
  self.postMessage(morphs);
});
