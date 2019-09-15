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

parentPort.on('message',(message)=>{
	if(message==="terminate"){
		parentPort.postMessage({done:true});
		process.exit(0);
	}
})

let seq = range;
//let seq = "truck".split('');
array_move(seq, index, 0);

let generator = permutator(seq.slice(1));

// for(var p of generator){
// 	let out = {};
// 	out.seq = [seq[0]].concat(p);
// 	out.id = workerData.i;
// 	parentPort.postMessage(out);
// }

let iterate = function(iterable){
	let n = iterable.next();
	let out = {};
	out.seq = [seq[0]].concat(n.value);
	out.id = workerData.i;
	parentPort.postMessage(out);
	if(!n.done){
		setTimeout(()=>{
			iterate(iterable);
		},0);
	}else{
		parentPort.postMessage({done:true});
	}
}
iterate(generator);
