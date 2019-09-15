/*

node --experimental-modules --experimental-worker index.js

*/

import moment from 'moment';

import {
  createRequire
} from 'module';
import {
  fileURLToPath as fromURL
} from 'url';
const require = createRequire(fromURL(
  import.meta.url));

const {
  Worker
} = require('worker_threads')
const _ = require('underscore');

import scoreSequence from '../lib/scoreSequence.js';

const SEQ_LENGTH = 9;
const MIN_SCORE_THRESHOLD = 1; // memory leak prevention
let topScore = 0;
let bestSequence = "";
const MOMENT_START = moment();
let TIME_TOP_SCORE_BEAT = moment();
let delta_since_last_beat = "";
let thread_performance = {};
let thread_iterations = {};
let duration = "";

const EXIT_THRESHOLD = 5000; // after how many iterations should a underperforming thread be cancelled?
const PERF_THRESHOLD = 0; // what thread score constitues underperformance?

function runService(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./service.js', {
      workerData
    });
    worker.on('message', (message) => {
      if (message.done) {
        resolve(message);
      } else {
        
        //console.log('score incoming permutation',message.seq.join(','));
        
        let score = scoreSequence(message.seq);
        //console.log({score});
        thread_iterations[message.id]++;
        if (score > topScore) {
          //thread_performance[message.id] += score - topScore;
          thread_performance[message.id] += score;
          topScore = score;
          bestSequence = message.seq;
          delta_since_last_beat = moment.utc(moment().diff(TIME_TOP_SCORE_BEAT)).format("HH:mm:ss");
          TIME_TOP_SCORE_BEAT = moment();
          duration = moment.utc(moment().diff(MOMENT_START)).format("HH:mm:ss");;

          console.log({
            topScore,
            duration,
            delta_since_last_beat,
            p:JSON.stringify(thread_performance),
            i:JSON.stringify(thread_iterations)
          });
        }
        if (thread_iterations[message.id] >= EXIT_THRESHOLD && thread_performance[message.id] <= PERF_THRESHOLD) {
          //console.warn('exiting underperforming thread', message.id);
          worker.postMessage('terminate');
          //worker.terminate();
        }
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
  for (var i = 1; i < SEQ_LENGTH + 1; i++) {
    thread_performance[i] = 0;
    thread_iterations[i] = 0;
    let promise = runService({
      i,
      SEQ_LENGTH,
      MIN_SCORE_THRESHOLD
    }).then((result) => {
      //console.log('final callback from ', result);
      //results.push(result);
    });
    promises.push(promise);
  }
  let promise_all = await Promise.all(promises).then(function(out) {

  });
  duration = moment.utc(moment().diff(MOMENT_START)).format("HH:mm:ss");;
  console.log('results', {
    topScore,
    seq:bestSequence.join(','),
    duration,
    delta_since_last_beat,
    thread_performance,
    thread_iterations
  })
}

run().catch(err => console.error(err))