let _ = require('underscore');

const { workerData, parentPort } = require('worker_threads')

let range = _.range(1,workerData.SEQ_LENGTH + 1);
let index = range.indexOf(workerData.i);

function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
};

let strand = array_move(range, index, 0);

let results = [];
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
  if(final>workerData.MIN_SCORE_THRESHOLD){
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

const permutator = (inputArr) => {
  let result = [];
  const MAX_DEPTH = 3;

  const permute = (arr, m = [], level) => {
    if (arr.length === 0) {
      scoreSequence(m);
      // if(score>MIN_SCORE_THRESHOLD){
      //result.push(m);
      // }
    } else {
      // TODO: add a heuristic that knows
      // if this recursion is going down a strand of
      // sequences that are not correct.
      for (let i = 0; i < arr.length; i++) {
        //console.log('i',i);
        let curr = arr.slice();
        let next = curr.splice(i, 1);
        level++;
        if(level < MAX_DEPTH){
        	permute(curr.slice(), m.concat(next), level)	
        }else{
        	//throw new Error("max depth reached");
        }
      }
   }
 }

 permute(inputArr, 1);

 return result;
}

let permuations = permutator(strand);

parentPort.postMessage({ permuations, results, topScore, bestSequence })
