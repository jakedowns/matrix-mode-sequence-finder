function * permutator(inputArr, m = [], level = 1) {
  //return new Promise((resolve, reject) => {
    let result = [];

    // permute takes an array, m is it's... 
    // output... 
    // level tracks recursion depth
    // ---
    // returns a promise that resolves 
    const * permute = (arr, m = [], level) => {
      if (arr.length === 0) {
        //result.push(m); // push 1 permutation into result array
        yield {seq:m, done: true};
      } else {
        for (let i = 0; i < arr.length; i++) {
          let curr = arr.slice(); // clone original array
          let next = curr.splice(i, 1); // take out the current index
          
          // pop stack
          //setTimeout(() => {
            // feed back into self, w/ original array and M with "tail"
            //permute(curr.slice(), m.concat(next), level+1)    
          //});
        }
      }
    }

    // permute the thing
    yield permute(inputArr, m, level);
  //})
}

export default permutator;