import { createRequire } from 'module';
import { fileURLToPath as fromURL } from 'url';
const require = createRequire(fromURL(import.meta.url));

const { workerData, parentPort } = require('worker_threads')
const _ = require('underscore');
import * as scoreSequence from '../lib/scoreSequence.js';
import permutator from '../lib/permutator.js';
import {array_move} from '../lib/util.js';

const range = _.range(1,workerData.SEQ_LENGTH + 1);
const index = range.indexOf(workerData.i);

let seq = ["t","r","u","c","k"];
array_move(seq, index, 0);

for await (candidate of permutator(seq.slice(1), seq[0])){
	parentPort.postMessage({index, seq:candidate.seq, done:candidate.done})
}

// permutator(seq).then((permutations)=>{
// 	parentPort.postMessage({index, permutations, done:true})
// });