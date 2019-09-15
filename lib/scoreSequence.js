function scoreSequence (seq){
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
  return final;
}

export default scoreSequence;