let _ = require('underscore');

const moment = require('moment');

let range = _.range(1,16); // 1 - 15

let topScore = 0;

let results = [];

const MIN_SCORE_THRESHOLD = 2000000; // memory leak prevention

const MOMENT_START = moment();
let TIME_TOP_SCORE_BEAT = moment();

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
    TIME_TOP_SCORE_BEAT = moment();
    topScore = final;
    let delta_since_last_beat = moment.utc(moment().diff(TIME_TOP_SCORE_BEAT)).format("HH:mm:ss");
    console.log({seq:seq.join(','), final, delta_since_last_beat});
   }
  }
	return final;
}

// let findTheBest = function(seq){
//   let topScore = 0;
//   let results = {};
//   let bestSeq = "";
//   //console.log('starting',seq);
//   // start off by doing X random samples to get a feel of the landscape
//   for(var i = 0; i<5000; i++){
//     // this could be wasteful and redundant though...
//     // let's keep track of the sequences we test so we don't re-test the same ones
//     let shuffled = null;
//     console.log('iteration ', i);
//     //while(shuffled === null || Object.keys(results).indexOf(shuffled.join(',')) > -1){
//       //console.log('already used?', shuffled ? Object.keys(results).indexOf(shuffled.join(',')) : null);
//       shuffled = _.shuffle(seq.slice());
//     //}
//     let score = scoreSequence(shuffled);
//     results[shuffled.join(',')] = score;
//     //console.log(score);
//     if(score > topScore){
//       topScore = score;
//       bestSeq = shuffled.join(',');
//     }
//   }
//   console.log('top Score', topScore, bestSeq);
// }

// console.log('start');
// findTheBest(_.range(1,12));

/*
scoreSequence(base); // res: 1
// random
for(var i=0; i<1000; i++){
	scoreSequence(_.shuffle(base));
}
scoreSequence(base.slice().reverse()); //res: 0
*/

// directed search

const permutator = (inputArr) => {
  let result = [];

  const permute = (arr, m = [], depth = 1) => {
    //console.log('permute', arr, m);
    let duration = moment.utc(moment().diff(MOMENT_START)).format("HH:mm:ss");;
    console.log({depth, duration});
    if (arr.length === 0) {
    	let score = scoreSequence(m);
      // if(score>MIN_SCORE_THRESHOLD){
	     // result.push(m);
      // }
      console.log('latest', m, score);
      console.log('update!', _.sortBy(results, 'final').reverse()[0]);


      let delta_since_last_beat = moment.utc(moment().diff(TIME_TOP_SCORE_BEAT)).format("HH:mm:ss");
      let duration = moment.utc(moment().diff(MOMENT_START)).format("HH:mm:ss");;
      console.log({duration, delta_since_last_beat});
    } else {
      // TODO: add a heuristic that knows
      // if this recursion is going down a strand of
      // sequences that are not correct.
      for (let i = 0; i < arr.length; i++) {
        //console.log('i',i);
        let curr = arr.slice();
        let next = curr.splice(i, 1);
        // pop stack
        setTimeout(()=>{
          permute(curr.slice(), m.concat(next), depth+1)
        },0)
      }
   }
 }

 permute(inputArr, [], 1);

 return result;
}


permutator(range);
//console.log('final!', _.sortBy(results, 'final').reverse()[0]);

// Find a general solution that applies to any length sequence of numbers
// approach Z brute force all permutations
// approach A start with a smaller sequence of numbers + find general pattern
// approach B binary search tree + Lazy permutor
// approach C machine learning (neural net)

//console.log(permutations);
/* _.map(permutations, (seq)=>{
scoreSequence(seq);
}) */

// winners:
//  2: 2,1: 2
//  3: 2,1,3: 4
//  4: 2,4,1,3: 8
//  5: 3,2,5,1,4: 18
//  6: 3,6,2,5,1,4: 45
//  7: 3,6,2,5,1,4,7: 135
//  8: 3,6,2,5,8,1,4,7: 405
//  9: 3,6,9,2,5,8,1,4,7: 1134
// 10: 3,6,9,2,5,8,1,4,7,10: 3402
// 11: 4,8,2,6,10,3,7,11,1,5,9: 11008
// 12: 4,8,12,2,6,10,3,7,11,1,5,9: 43776
// 13:
// 14:
// 15:

// pattern: a,b,c,d,e => c,b,e,a,d

// NOPE LOL

// find midpoint (round up)
// highest -> midpoint
// split into 2 stacks:
// deal out:
	// < mid (ascending)
  	// (shift) closest spot right of M
    // (shift) closest spot left of M
  // > mid (ascending)
    // (shift) closest post LEFT of M
    // (shift) closest spot Right of M
	// repeat until all spots full + list A n B exhausted
  
// let craftPerfectSequence = function (base){
// 	if(base.length<2){
// 		return new Error('must be 2 len or longer');
// 	}
//   let midIndex = Math.ceil(base.length/2);
//   let mid = midIndex + 1;
//   let lessThanMid = base.slice(0,base.indexOf(mid));
//   let greaterThanMid = base.slice(base.indexOf(mid)+1);
//   let final = [];

// 	final[midIndex] = mid;
  
//   console.log({len:base.length, midIndex, mid, lessThanMid, greaterThanMid});
  
//   // TODO: could zip up less than and greater than in a single sequence
//   var slots = base.length - 1;
//   while(slots>0){
//   	let offset = base.length - 1 - slots;
//   	if(lessThanMid.length){ final[midIndex+offset] = lessThanMid.shift(); slots-=1; }
//     if(lessThanMid.length){ final[midIndex-offset] = lessThanMid.shift(); slots-=1; }
    
//     offset += 1;
    
//     if(greaterThanMid.length){ final[midIndex-offset] = greaterThanMid.shift(); slots-=1; }
//     if(greaterThanMid.length){ final[midIndex+offset] = greaterThanMid.shift(); slots-=1; }
//   }
  
//   console.log(final);
//   return [];
//   //return final;
// }

//scoreSequence(craftPerfectSequence(_.range(1,12)));
