let _ = require('underscore');
const fs = require('fs');

let SAVEFILEPATH = "./results.json";

/*

todo: accept params for: 
min_score, 
seq_len, 
max_generations,
max_iterations_per_generation
max_generations_before_stopping

*/

let rankings = {};
let idealNumberForSlots = {};

let SEQ_LEN = process.argv[2]; // || 13;
if(!SEQ_LEN){
	return;
}
console.log('STARTING for SEQ_LEN',SEQ_LEN);
const MIN_SCORE_THRESHOLD = 1; //2457600; // memory leak protection

let range = _.range(1, SEQ_LEN + 1);
let topScore = 0;
let topScoringSequence = "";
let topScoringID = "";
let results = [];
let iteration = 1;
let weightedLists = [];
let scoreSequence = function(seq, id) {
	let final = -1;
	let prev = -1;
	seq.map((ball) => {
		if (final === -1) {
			final = ball;
		} else {
			if (ball > prev) {
				final *= (ball - prev);
			} else {
				final = Math.round(final / ball);
				if (final < 0) {
					final = 0;
				}
			}
		}
		//console.log(ball, prev, final);
		prev = ball;
	});
	if (final > MIN_SCORE_THRESHOLD) {
		//console.log(final);
		results.push({
			seq: seq.join(','),
			final
		});
		if (final > topScore) {
			let seqString = seq.join(',');
			topScore = final;
			console.log({
				i: id,
				seqString,
				final
			});
			topScoringSequence = seqString;
			topScoringID = id;

			// get latest used weighted list used to generate this sequence
			_.map(weightedLists, (list, slot) => {
				var freq = list.reduce((a, c) => (a[c] = ++a[c] || 1, a), {});
				out = {};
				_.mapObject(freq, (v, k) => {
					if (v > 1) {
						out[k] = v;
					}
				});
				if (Object.keys(out).length) {
					console.log('weightedList for slot:', {
						slot: slot + 1,
						out
					});
				}
			})
			//console.log('save');
			// save to our .json file

			let contents = {};
			try {
				let data = fs.readFileSync(SAVEFILEPATH, "utf-8", {
					flag: 'w+'
				});
				contents = JSON.parse(data);
			} catch (e) {
				console.warn('creating new file');
			}
			// console.log('fileread', {
			// 	contents
			// });
			let obj = typeof contents['seq_len_' + SEQ_LEN] !== "undefined" ? contents['seq_len_' + SEQ_LEN] : {
				top: 0
			};
			if (!obj || !obj.top || final > obj.top) {
				obj.id = id;
				obj.top = final;
				obj.best = seqString;
				obj.idealNumberForSlots = idealNumberForSlots;
			}
			contents['seq_len_' + SEQ_LEN] = obj;
			let output = contents;
			let writeOp = fs.writeFileSync(SAVEFILEPATH, JSON.stringify(output, null, 2), {
				flag: 'w+'
			});
			//console.log(writeOp);
		}
	}
	return final;
}

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

/*

		SETUP

*/

_.map(range, (number) => {
	rankings[number] = {};
	_.map(range, (ordinal) => {
		rankings[number][ordinal] = 0;
	});
});

let max_generations = 10;
let generation = 1;

let contents = {};
try {
	let data = fs.readFileSync(SAVEFILEPATH, "utf-8", {
		flag: 'w+'
	});
	contents = JSON.parse(data);
} catch (e) {
	console.warn('creating new file');
}
if (contents &&
	contents["seq_len_"+SEQ_LEN] &&
	contents["seq_len_"+SEQ_LEN].idealNumberForSlots
) {
	// pick up where we left off
	console.log('picking up where we left off for ',"seq_len_"+SEQ_LEN);
	idealNumberForSlots = contents["seq_len_"+SEQ_LEN].idealNumberForSlots;
}


function runGeneration() {
	for (var i = 0; i < 1000000; i++) {
		let arr = range.slice();

		let shuffled = getSemiRandomSequence(arr); //_.shuffle(arr);

		let prevBest = topScore;

		iteration = i;

		let score = scoreSequence(shuffled, generation + "-" + i);

		if (score > prevBest) {
			_.map(shuffled, (num, ord) => {
				// used to increment by 1 for all winners
				//rankings[num][ord+1]++;

				// getting stuck with local maxima
				// let's try weighting a little heavier by using the
				// full score as the value to be added
				// or the difference between the best and previous?
				//rankings[num][ord+1]+=score; // delta
				rankings[num][ord + 1] += score - prevBest; // delta
			});
		}
	}

	generation++;
	if (generation > max_generations) {
		// END
		filterRankings(rankings, 3);
		console.log('FINAL', {
			topScoringSequence,
			topScore,
			topScoringID,
			idealNumberForSlots
		});
		return;
	}

	filterRankings(rankings, 1);
	console.log('NEXT GEN', {
		generation,
		topScoringSequence,
		topScore,
		topScoringID,
		//idealNumberForSlots
	});

	// pop stack (GC)
	setTimeout(() => {
		runGeneration(); // recurse
	});
}

var rand = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

function generateWeightedList(slot, pool) {
	let weightedList = pool.slice();
	for (var i = 1; i <= range.length; i++) {
		// for each slot
		if (idealNumberForSlots[slot]) {
			// if we have any scored candidate numbers for this slot
			// let's add them to our weighted list (as long as they're in the pool)

			let maxScoreForSlot = _.reduce(idealNumberForSlots[slot], (memo, num) => {
				return memo + num;
			}, 0);

			let averageScoreForSlot = maxScoreForSlot / Object.keys(idealNumberForSlots).length;

			_.mapObject(idealNumberForSlots[slot], (score, number) => {
				number = parseInt(number);
				let inPool = pool.indexOf(number) > -1;
				//console.log({inPool, number, score});

				if (inPool) {
					let weight = score / maxScoreForSlot;
					let comparedToAverage = score / averageScoreForSlot;
					// console.log('weighting number', {
					// 	slot, 
					// 	number, 
					// 	score,
					// 	maxScoreForSlot,
					// 	averageScoreForSlot,
					// 	comparedToAverage,
					// 	weight,
					// 	weightedListLen: weightedList.length
					// });
					for (var b = 0; b < Math.round(comparedToAverage); b++) {
						weightedList.push(number);
					}
				}
			})
		}
	}
	if (weightedList.length > pool.length) {
		// console.log('weighted list for slot', {slot, 
		// 	weightedListLen:weightedList.length, 
		// 	poolLen: pool.length, 
		// 	//idealNumberForSlots
		// });
	}
	return weightedList;
}

function getSemiRandomSequence(arr) {
	let final = [];
	let pool = arr.slice();

	weightedLists = [];

	for (var i = 1; i <= arr.length; i++) {
		// for each slot
		let weightedList = generateWeightedList(i, pool);
		// make our pick for the slot
		weightedList = _.shuffle(weightedList);

		weightedLists.push(weightedList);

		let picked = weightedList[rand(0, weightedList.length)];
		// remove the pick from the pool
		let index = pool.indexOf(picked);
		pool.splice(index, 1);
		final.push(picked);

		//console.log('pool', {len:pool.length, picked, index, len2: final.length});
	}

	// TODO: check for no dupes, len is base.len

	//console.log('getSemiRandomSequence', {final, len: arr.length});
	return final;
}

function filterRankings(rankings, threshold = 3) {
	let filtered = {};
	idealNumberForSlots = {};

	_.mapObject(rankings, (ordered, num) => {
		let out = {};
		_.mapObject(ordered, (score, slot) => {
			if (!idealNumberForSlots[slot]) {
				idealNumberForSlots[slot] = {};
			}
			if (score >= threshold) {
				out[slot] = score;
				if (!idealNumberForSlots[slot][num]) {
					idealNumberForSlots[slot][num] = 0;
				}
				idealNumberForSlots[slot][num] += score;
			}
		});
		if (Object.keys(out).length) {
			filtered[num] = out;
		}
	});

	//console.log({filtered, idealNumberForSlots});

	return filtered;
}

runGeneration();

/*
 method:
	1. we randomly shuffle our sequence
	2. we score the sequence
	3. we check the index for each number in the sequence
	4. if the total score for the sequence is higher than previous best
	5. we increment the Number+Index ranking by 1
	6. after N iterations, we examine 
		- top scoring random sequence
		- best ranked Index values for each number
		- then we narrow down the order from there?
		- finally, we can use our Permutor brute force once we have 
			locked in the first 5 or so digits?

	this method is likely to hit a dead end,
	but it seems like a fun thing to attempt.
*/