// index.js
// run with node --experimental-worker index.js on Node.js 10.x
const { Worker } = require('worker_threads')

let _ = require('underscore');

let results = [];
const SEQ_LENGTH = 15;
const MIN_SCORE_THRESHOLD = 1; // memory leak prevention
let topScore = 0;
let bestSequence = "";

let scoreSequence = function(seq){
  let final = -1;
  let prev = -1;
  seq.map((ball)=>{
    if(final === -1){
      final = ball;
    }else{
      if(ball > prev){
        final *= (ball - prev);
      }else{
        final = Math.round(final / ball);
        if(final < 0){ final = 0; }
      }
    }
    //console.log(ball, prev, final);
    prev = ball;
  });
  if(final>MIN_SCORE_THRESHOLD){
   //console.log(final);
   results.push({seq:seq.join(','), final});
   if(final > topScore){
    topScore = final;
    console.log({seq:seq.join(','), final});
    bestSequence = seq.join(',');
   }
  }
  return final;
}

function runService(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./service.js', { workerData });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    })
  })
}

async function run() {
  let promises = [];

  for(var i = 1; i < SEQ_LENGTH + 1; i++){
    promises.push(runService({i, SEQ_LENGTH, MIN_SCORE_THRESHOLD})); // check strand
  }

  let results = await Promise.all(promises).then(function(out){
    console.log(out);
    // _.map(out, (v,k)=>{
    //   // _.map(v.permuations, (v2,k2)=>{
    //   //   scoreSequence(v2);
    //   // });
    // })

    //console.log('BEST! ', topScore, bestSequence);
  });
}

run().catch(err => console.error(err))
