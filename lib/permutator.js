function* permutator(arr, m = [], level = 1, index = 0) {
  let f = factorialize(arr.length);
  for (var i = 0; i < f; i++) {
    if (i === f - 1) {
      return array_nth_permutation(arr, i);
    } else {
      yield array_nth_permutation(arr, i);
    }
  }
}

export default permutator;

// from SO
function array_nth_permutation(a, n) {
    var b = a.slice();  // copy of the set
    var len = a.length; // length of the set
    var res;            // return value, undefined
    var i, f;

    // compute f = factorial(len)
    for (f = i = 1; i <= len; i++)
        f *= i;

    // if the permutation number is within range
    if (n >= 0 && n < f) {
        // start with the empty set, loop for len elements
        for (res = []; len > 0; len--) {
            // determine the next element:
            // there are f/len subsets for each possible element,
            f /= len;
            // a simple division gives the leading element index
            i = Math.floor(n / f);
            // alternately: i = (n - n % f) / f;
            res.push(b.splice(i, 1)[0]);
            // reduce n for the remaining subset:
            // compute the remainder of the above division
            n %= f;
            // extract the i-th element from b and push it at the end of res
        }
    }
    // return the permutated set or undefined if n is out of range
    return res;
}

function factorialize(num) {
  if (num < 0)
    return -1;
  else if (num == 0)
    return 1;
  else {
    return (num * factorialize(num - 1));
  }
}