// Each puzzle has:
//   numbers:   5 single-digit numbers shown to the player
//   operators: the 4 correct operators (the hidden answer)
//   result:    the value after the = sign (computed with standard operator precedence)
//
// Verification format: a op1 b op2 c op3 d op4 e = result
// Standard precedence applies: * and / bind before + and -

const PUZZLES = [
  // --- EASY (mostly + and -) ---
  { numbers: [1,2,3,4,5], operators: ['+','+','+','+'], result: 15 },   // 1+2+3+4+5=15
  { numbers: [2,3,4,5,6], operators: ['+','+','+','+'], result: 20 },   // 2+3+4+5+6=20
  { numbers: [3,4,5,6,7], operators: ['+','+','+','+'], result: 25 },   // 3+4+5+6+7=25
  { numbers: [4,5,6,7,8], operators: ['+','+','+','+'], result: 30 },   // 4+5+6+7+8=30
  { numbers: [5,6,7,8,9], operators: ['+','+','+','+'], result: 35 },   // 5+6+7+8+9=35
  { numbers: [9,8,6,5,4], operators: ['+','+','-','-'], result: 14 },   // 9+8+6-5-4=14
  { numbers: [8,7,6,5,4], operators: ['+','+','-','-'], result: 12 },   // 8+7+6-5-4=12
  { numbers: [7,6,5,4,3], operators: ['+','+','-','-'], result: 11 },   // 7+6+5-4-3=11
  { numbers: [9,7,5,4,3], operators: ['+','+','-','-'], result: 14 },   // 9+7+5-4-3=14 same result as #6, fine
  { numbers: [6,5,4,3,2], operators: ['+','+','-','-'], result: 10 },   // 6+5+4-3-2=10

  // --- MEDIUM (one multiplication) ---
  { numbers: [2,3,1,4,5], operators: ['*','+','+','+'], result: 16 },   // 2*3+1+4+5=16
  { numbers: [5,3,1,2,4], operators: ['*','+','+','+'], result: 22 },   // 5*3+1+2+4=22
  { numbers: [6,3,1,2,4], operators: ['*','+','+','+'], result: 24 },   // 6*3+1+2+4=24
  { numbers: [3,4,2,1,5], operators: ['+','*','+','+'], result: 17 },   // 3+4*2+1+5=17
  { numbers: [1,5,2,3,4], operators: ['+','*','+','+'], result: 18 },   // 1+5*2+3+4=18
  { numbers: [2,5,4,3,1], operators: ['+','*','+','+'], result: 26 },   // 2+5*4+3+1=26
  { numbers: [2,4,7,3,1], operators: ['+','+','*','+'], result: 28 },   // 2+4+7*3+1=28
  { numbers: [1,3,6,2,4], operators: ['+','+','*','+'], result: 20 },   // 1+3+6*2+4 = 1+3+12+4 = 20
  { numbers: [1,2,3,5,4], operators: ['+','+','+','*'], result: 26 },   // 1+2+3+5*4=26
  { numbers: [2,4,5,6,3], operators: ['+','+','+','*'], result: 29 },   // 2+4+5+6*3=29
  { numbers: [2,3,4,6,5], operators: ['+','+','+','*'], result: 39 },   // 2+3+4+6*5=39
  { numbers: [7,2,3,4,5], operators: ['-','*','+','+'], result: 10 },   // 7-2*3+4+5=10
  { numbers: [9,3,2,4,1], operators: ['-','*','+','+'], result: 8  },   // 9-3*2+4+1=8
  { numbers: [6,2,4,3,5], operators: ['-','*','+','+'], result: 6  },   // 6-2*4+3+5=6
  { numbers: [5,2,3,4,6], operators: ['-','*','+','+'], result: 9  },   // 5-2*3+4+6=9

  // --- MEDIUM (one multiplication, different positions) ---
  { numbers: [9,5,3,2,4], operators: ['+','-','*','+'], result: 12 },   // 9+5-3*2+4=12
  { numbers: [4,3,5,2,6], operators: ['+','-','*','+'], result: 3  },   // 4+3-5*2+6=3
  { numbers: [9,6,2,3,4], operators: ['+','-','*','+'], result: 13 },   // 9+6-2*3+4=13
  { numbers: [5,6,8,3,4], operators: ['+','+','-','*'], result: 7  },   // 5+6+8-3*4=7

  // --- HARDER (two multiplications) ---
  { numbers: [3,2,4,5,6], operators: ['*','+','*','+'], result: 32 },   // 3*2+4*5+6=32
  { numbers: [3,4,2,5,6], operators: ['*','+','*','+'], result: 28 },   // 3*4+2*5+6=28
  { numbers: [5,3,4,2,6], operators: ['*','+','*','+'], result: 29 },   // 5*3+4*2+6=29
  { numbers: [6,3,2,4,5], operators: ['*','+','*','+'], result: 31 },   // 6*3+2*4+5=31
  { numbers: [7,3,2,4,5], operators: ['*','+','*','+'], result: 34 },   // 7*3+2*4+5=34
  { numbers: [8,2,3,4,5], operators: ['*','+','*','+'], result: 33 },   // 8*2+3*4+5=33
  { numbers: [9,2,3,4,5], operators: ['*','+','*','+'], result: 35 },   // 9*2+3*4+5=35
  { numbers: [5,4,3,6,2], operators: ['*','-','*','+'], result: 4  },   // 5*4-3*6+2=4
  { numbers: [8,4,3,5,2], operators: ['*','-','*','+'], result: 19 },   // 8*4-3*5+2=19
  { numbers: [9,6,3,4,2], operators: ['*','-','*','+'], result: 44 },   // 9*6-3*4+2=44
  { numbers: [9,3,5,2,4], operators: ['*','-','+','*'], result: 30 },   // 9*3-5+2*4=30
  { numbers: [6,3,4,2,5], operators: ['*','-','+','*'], result: 24 },   // 6*3-4+2*5=24
  { numbers: [7,3,4,2,5], operators: ['*','-','+','*'], result: 27 },   // 7*3-4+2*5=27
  { numbers: [4,5,2,3,6], operators: ['*','-','+','*'], result: 36 },   // 4*5-2+3*6=36
  { numbers: [3,6,2,4,5], operators: ['*','+','-','*'], result: 0  },   // 3*6+2-4*5=0
  { numbers: [7,6,5,4,3], operators: ['*','-','-','+'], result: 36 },   // 7*6-5-4+3=36
  { numbers: [8,6,5,4,3], operators: ['*','-','-','+'], result: 42 },   // 8*6-5-4+3=42
  { numbers: [9,6,5,4,3], operators: ['*','-','-','+'], result: 48 },   // 9*6-5-4+3=48

  // --- HARDER (mixed with division) ---
  { numbers: [8,4,7,5,3], operators: ['/','+','*','+'], result: 40 },   // 8/4+7*5+3=40
  { numbers: [6,2,5,3,4], operators: ['/','+','*','+'], result: 22 },   // 6/2+5*3+4=22
  { numbers: [9,3,4,5,2], operators: ['/','+','*','+'], result: 25 },   // 9/3+4*5+2=25
  { numbers: [8,4,3,5,2], operators: ['/','+','*','+'], result: 19 },   // 8/4+3*5+2=19  same result as #38, different puzzle ✓
  { numbers: [6,3,4,2,5], operators: ['/','+','*','+'], result: 15 },   // 6/3+4*2+5=15

  // --- HARD (large results, complex patterns) ---
  { numbers: [6,7,3,4,2], operators: ['*','+','-','*'], result: 37 },   // 6*7+3-4*2=37
  { numbers: [8,7,3,4,2], operators: ['*','+','-','*'], result: 51 },   // 8*7+3-4*2=51
  { numbers: [9,7,3,4,2], operators: ['*','+','-','*'], result: 58 },   // 9*7+3-4*2=58
  { numbers: [4,8,3,5,2], operators: ['*','+','*','-'], result: 45 },   // 4*8+3*5-2=45
  { numbers: [5,8,3,4,2], operators: ['*','+','*','-'], result: 50 },   // 5*8+3*4-2=50
  { numbers: [5,9,3,4,2], operators: ['*','+','*','-'], result: 55 },   // 5*9+3*4-2=55
  { numbers: [6,9,3,4,2], operators: ['*','+','*','-'], result: 64 },   // 6*9+3*4-2=64
  { numbers: [4,9,5,6,1], operators: ['+','*','-','*'], result: 43 },   // 4+9*5-6*1=43
  { numbers: [7,9,4,5,1], operators: ['+','*','-','*'], result: 38 },   // 7+9*4-5*1=38
  { numbers: [4,9,6,5,1], operators: ['+','*','-','*'], result: 53 },   // 4+9*6-5*1=53
  { numbers: [2,9,7,5,1], operators: ['+','*','-','*'], result: 60 },   // 2+9*7-5*1=60
  { numbers: [7,8,4,3,2], operators: ['*','+','-','*'], result: 54 },   // 7*8+4-3*2=54
  { numbers: [8,9,4,3,2], operators: ['*','+','-','*'], result: 70 },   // 8*9+4-3*2=70
  { numbers: [9,8,5,3,2], operators: ['*','+','-','*'], result: 71 },   // 9*8+5-3*2=71
  { numbers: [9,8,6,3,2], operators: ['*','+','-','*'], result: 72 },   // 9*8+6-3*2=72
];

// Validate all puzzles on load (development helper — remove or disable in production)
(function validatePuzzles() {
  const ops = { '+': (a,b) => a+b, '-': (a,b) => a-b, '*': (a,b) => a*b, '/': (a,b) => a/b };

  function evalEquation(numbers, operators) {
    // Build token list and evaluate with standard operator precedence
    const tokens = [];
    for (let i = 0; i < numbers.length; i++) {
      tokens.push(numbers[i]);
      if (i < operators.length) tokens.push(operators[i]);
    }
    // Pass 1: resolve * and /
    let i = 1;
    while (i < tokens.length) {
      if (tokens[i] === '*' || tokens[i] === '/') {
        const val = ops[tokens[i]](tokens[i-1], tokens[i+1]);
        tokens.splice(i-1, 3, val);
      } else {
        i += 2;
      }
    }
    // Pass 2: resolve + and -
    let result = tokens[0];
    for (let j = 1; j < tokens.length; j += 2) {
      result = ops[tokens[j]](result, tokens[j+1]);
    }
    return result;
  }

  PUZZLES.forEach((p, idx) => {
    const computed = evalEquation(p.numbers, p.operators);
    if (computed !== p.result) {
      console.error(`Puzzle ${idx + 1} INVALID: expected ${p.result}, got ${computed}`, p);
    }
  });
})();
