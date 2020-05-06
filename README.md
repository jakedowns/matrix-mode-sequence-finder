# [Request for help] 3D Billiards Pool: Matrix Mode Solution Proof

[View Source Code on Github](https://github.com/jakedowns/matrix-mode-sequence-finder)

Eivaa Games' [Pool Billiards 3D](https://www.eivaagames.com/games/pool-billiards-3d/) has this unique *Matrix* mode. It's has a "correct solution" to get the highest score possible. but when I set about finding it, I ran into some interesting challenges. I'm wondering if any math wizards out there can devise a way of PROVING what the BEST sequence of 1-15 is to achieve the highest possible score in this mode. The way the mode is scored is as follows:

> Rules: "In Matrix Mode, when you pocket a ball your score will be multiplied by the difference of your previous and current ball number if the current is more than the previous; but if the current is less, then your score is divided by the current ball number."

One interesting side-effect of this scoring method is that if you pocket the balls in sequence 1,2,3...15 your final score will be **1**.

### Update 5.6.2020 - A new top score!

| player      | score     | sequence                            |
|-------------|-----------|-------------------------------------|
| rerusselljr | 2,796,160 | 4,8,12,1,5,9,13,2,6,10,14,3,7,11,15 |
| jakedowns   | 2,793,472 | 4,8,12,2,6,10,14,3,7,11,15,1,5,9,13 |
|             |           |                                     |

> **rerusselljr**: I noticed that the sequence had groups of numbers increasing by 4, but were "out of order".
> The sequence you posted was: `4,8,12,2,6,10,14,3,7,11,15,1,5,9,13`
> This sequence gives you 2,793,472 (when dividing by three, the game rounds down/uses the floor). I noticed the "1" group was in at the end instead of after the "4" group. I thought of it like the circle of fourths/fifths in music. In this case, the fourth number after 12 in 15 is 1, not 2. So, I rearranged your sequence to: `4,8,12,1,5,9,13,2,6,10,14,3,7,11,15`
> The score I got was 2,796,160.
>
>I still am not sure if this is the highest, as I just started thinking about this problem literally about an hour or two before writing this. Also, I am not much of a mathematician. Maybe the folks at Numberphile can find a solution.

### My Approach

I set about solving shorter sequences as an exercise and I was able to brute-force check & score each possible permutation for seq. length 2-11 to find the highest scoring sequences:

```
 2: 2,1: 2
 3: 2,1,3: 4
 4: 2,4,1,3: 8
 5: 3,2,5,1,4: 18
 6: 3,6,2,5,1,4: 45
 7: 3,6,2,5,1,4,7: 135
 8: 3,6,2,5,8,1,4,7: 405
 9: 3,6,9,2,5,8,1,4,7: 1134
10: 3,6,9,2,5,8,1,4,7,10: 3402
11: 4,8,2,6,10,3,7,11,1,5,9: 11008
```

However, I began to hit memory limits and my naive first-pass Javascript code would need some performance tuning to be able to brute-force check 12-15. Plus, I don't know how long it would take my laptop to check 15^15 solutions (I'm sure I could estimate this)

Examining the shorter sequences, I wasn't able to identify any simple pattern for "dealing" out the numbers in sequence. Only pattern I noticed was the starting numbers of 2(x3),3(x6),4(x?) which means the best scoring sequence for 12-15 is _likely_ to start with a 4, maybe followed by an 8. but i'd like to **prove** that.

Visual Pattern Analysis Attempt:

![](https://i.imgur.com/GqZ5A7X.png)

**X-Axis**: sequence length, **Y-Axis**: ball number, each cell is the slot # or "position" of each Y-axis ball number in the corresponding "best" sequence for each sequence length.

---

My best attempt at solving this so far has been a semi-random-weighted search. The method I'm currently using is as follows:

1. Randomly shuffle numbers
1. Score the sequence
1. Shuffle again, and compare score to previous "top score"
1. If a random sequence beats the previous "top score" increase the IdealNumbersForSlots hashmap of weights for each slot:# combination
1. During the next shuffling of numbers theres a (configurable) 50/50 probability that the seq will be random OR use the Weights hashmap to build a weighted array (for each slot) from which a number will be picked until the pool of 1-15 is exhausted
1. Score, Check, Repeat.

The top score I've been able to acheive so far with this method is `2,797,568` using the sequence: `4,8,12,2,6,10,14,3,7,11,15,1,5,9,13` my score prediction was a little off; it lead to a final in-game score of `2,793,472`

![](https://i.imgur.com/1T0rxHB.jpg)

Unfortunately there's no global leader board in the game for this mode, so I'm not sure if that's the best sequence, or if there's still a better one out there. 🤩

---

Here's some other methods I'd like to attempt for solving this riddle:
1. Performance optimized Multi-threaded Brute Force (GPU assisted?)
2. Machine Learning / Neural Network Approach?
3. A more wholistic weighted approach that recognizes not only the best balls for each spot, but also their relationship to the others in the sequence around them to weight when they appear before or after another number
4. something based on a more logical strategy where it would only need to test a handful of possibilities fitting a specific criteria

---

My Scoring Function:

```
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
        final = Math.round(final / ball); // maybe they use floor or ceil here?
        if(final < 0){ final = 0; }
      }
    }
    //console.log(ball, prev, final);
    prev = ball;
  });
  return final;
}
```

---

Latest notes:

- my latest multi threaded attempt:

  A) did not fully utilize my CPU (maybe we should try a compiled language, or a CUDA type thing)

  B) would have taken 408 years to exhaust all permutations
		
		
