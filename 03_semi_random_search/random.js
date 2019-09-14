let _ = require('underscore');
const yargs = require('yargs');
const fs = require('fs');
const moment = require('moment');

let SAVEFILEPATH = "./results.json";

var nf = new Intl.NumberFormat();

/*

params for: 
seq_len, 
min_score,
MAX_GENERATIONS,
MAX_ITERATIONS_PER_GENERATION
MAX_GENERATIONS_before_stopping

WEIGHT_MODE (1=delta, 2=total)
FRESH_START

*/
const MOMENT_START = moment();
const argv = yargs
	.command('', 'Calculates best sequence for 3D Pool Matrix Mode')
	.option('SEQ_LEN', {
		alias: 'l',
		description: 'How long of a sequence to run',
		type: 'number',
	})
	.option('MIN_SCORE_THRESHOLD', {
		alias: 'm'
	})
	.option('MAX_GENERATIONS', {
		alias: 'g'
	})
	.option('MAX_ITERATIONS_PER_GENERATION', {
		alias: 'i'
	})
	.option('WEIGHT_MODE', {
		alias: 'w',
	})
	.option('FRESH_START', {
		alias: 'f',
		description: 'reset results.json for seq',
		type: 'boolean'
	})
	.help()
	.alias('help', 'h')
	.argv;

const WEIGHT_MODE = argv.WEIGHT_MODE || 1;
const FRESH_START = argv.FRESH_START || false;

let rankings = {};
let idealNumberForSlots = {};

let SEQ_LEN = argv.SEQ_LEN;
if (!SEQ_LEN) {
	return;
}
console.log('STARTING for SEQ_LEN', SEQ_LEN);
const MIN_SCORE_THRESHOLD = argv.MIN_SCORE_THRESHOLD || 0; // memory leak protection

let range = _.range(1, SEQ_LEN + 1);
let topScore = 0;
let topScoringSequence = "";
let topScoringID = "";
let TIME_TOP_SCORE_BEAT = moment();
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
			topScoringSequence = seqString;
			topScoringID = id;
			TIME_TOP_SCORE_BEAT = moment()

			let delta_since_last_beat = moment.utc(moment().diff(TIME_TOP_SCORE_BEAT)).format("HH:mm:ss");
			console.log({
				i: id,
				seqString,
				final: nf.format(final),
				delta_since_last_beat
			});


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

const MAX_GENERATIONS = argv.MAX_GENERATIONS || 10;
const MAX_ITERATIONS_PER_GENERATION = argv.MAX_ITERATIONS_PER_GENERATION || 1000000;
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
if (FRESH_START) {
	console.log('fresh start');
	if (contents &&
		contents["seq_len_" + SEQ_LEN]
	) {
		contents["seq_len_" + SEQ_LEN] = {
			top: 0
		};
		fs.writeFileSync(SAVEFILEPATH, JSON.stringify(contents, null, 2));
	}
} else {
	if (contents &&
		contents["seq_len_" + SEQ_LEN] &&
		contents["seq_len_" + SEQ_LEN].idealNumberForSlots
	) {
		// pick up where we left off
		topScoringSequence = contents["seq_len_" + SEQ_LEN].best;
		topScore = contents["seq_len_" + SEQ_LEN].top;
		idealNumberForSlots = contents["seq_len_" + SEQ_LEN].idealNumberForSlots;

		console.log('picking up where we left off for ', "seq_len_" + SEQ_LEN, {
			topScore,
			topScoringSequence,
			idealNumberForSlots
		});
	}
}


function runGeneration() {
	for (var i = 0; i < MAX_ITERATIONS_PER_GENERATION; i++) {
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

				if (WEIGHT_MODE === 1) {
					rankings[num][ord + 1] += score - prevBest; // delta
				} else if (WEIGHT_MODE === 2) {
					rankings[num][ord + 1] += score; // total
				}

			});
		}
	}

	let duration = moment.utc(moment().diff(MOMENT_START)).format("HH:mm:ss");
	let delta_since_last_beat = moment.utc(moment().diff(TIME_TOP_SCORE_BEAT)).format("HH:mm:ss");

	generation++;
	if (generation > MAX_GENERATIONS) {
		// END
		filterRankings(rankings, 3);
		console.log('FINAL', {
			topScoringSequence,
			topScore: nf.format(topScore),
			topScoringID,
			idealNumberForSlots,
			duration,
			delta_since_last_beat
		});
		return;
	}

	filterRankings(rankings, 1);
	console.log('NEXT GEN', {
		generation,
		topScoringSequence,
		topScore: nf.format(topScore),
		topScoringID,
		duration,
		delta_since_last_beat,
		idealNumberForSlots
	});

	// pop stack (GC)
	setTimeout(() => {
		runGeneration(); // recurse
	});
}

var rand = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};
var probability = function(n) {
     return !!n && Math.random() <= n;
};

function generateWeightedList(slot, pool) {
	let weightedList = pool.slice();

	// half the time... ignore our weights and go full random.
	if(probability(.5)){
		return weightedList;
	}

	for (var i = 1; i <= range.length; i++) {
		// for each slot
		if (idealNumberForSlots[slot]) {
			// if we have any scored candidate numbers for this slot
			// let's add them to our weighted list (as long as they're in the pool)

			_.mapObject(idealNumberForSlots[slot], (score, number) => {
				number = parseInt(number);
				let inPool = pool.indexOf(number) > -1;
				//console.log({inPool, number, score});

				if (inPool) {
					if(probability(.5)){
						// introducing some chance here that adds some noise to the weights
						// by ignoring scores occasionally 
						// so that we don't get stuck with overly confident local maxima
						for (var b = 0; b < score; b++) {
							weightedList.push(number);
						}
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
	//idealNumberForSlots = {};

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

	// normalize weights
	_.map(range, (slot, key) => {
		let maxScoreForSlot = _.reduce(idealNumberForSlots[slot], (memo, num) => {
			return memo + num;
		}, 0);

		let averageScoreForSlot = maxScoreForSlot / Object.keys(idealNumberForSlots).length;

		_.mapObject(idealNumberForSlots[slot], (score, number) => {
			let weight = score / maxScoreForSlot;
			let comparedToAverage = score / averageScoreForSlot;
			idealNumberForSlots[slot][number] = Math.ceil(comparedToAverage); // was Math.round
		});
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