export const array_move = function(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
};

export const rand  = function(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const probability = function(n) {
     return !!n && Math.random() <= n;
};

export const lerp = function(minA, maxA, currA, minB, maxB){
  var distA = maxA - minA;
  var distB = maxB - minB;
  var scale = (currA - minA) / distA;
  var currB = minB + (distB * scale);
  // console.log([minA,maxA], [minB,maxB], currA, '->', result);
  return currB;
};