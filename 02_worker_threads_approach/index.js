/*

node --experimental-modules --experimental-worker index.js

*/

import { createRequire } from 'module';
import { fileURLToPath as fromURL } from 'url';
const require = createRequire(fromURL(import.meta.url));

const { Worker } = require('worker_threads')
const _ = require('underscore');

const SEQ_LENGTH = 5;
const MIN_SCORE_THRESHOLD = 1; // memory leak prevention
let topScore = 0;
let bestSequence = "";

function runService(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./service.js', { workerData });
    worker.on('message', (message)=>{
      if(message.done){
        resolve(message);
      }else{
        console.log(message);
      }
    });
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    })
  })
}

async function run() {
  let promises = [];
  let results = [];
  for(var i = 1; i < SEQ_LENGTH + 1; i++){
    let promise = runService({i, SEQ_LENGTH, MIN_SCORE_THRESHOLD}).then((result)=>{
      console.log('call back from ', {index:result.index, mixed:result.permutations.length});
      results.push(result);
    });
    promises.push(promise);
  }
  let promise_all = await Promise.all(promises).then(function(out){
    //console.log('all resolved', {out, results});
  });
  //console.log('results?', promise_all);
}

run().catch(err => console.error(err))
