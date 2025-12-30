// CALCULATOR PROGRAM

const DISPLAY = document.getElementById("display");

function appendToDisplay(input) 
{
  DISPLAY.value += input;
}

function clearDisplay() 
{
  DISPLAY.value = "";
}

function calculate() 
{
  try {
    const expr = DISPLAY.value;

    // Allow only digits, operators, parentheses, decimal points, and whitespace
    if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
      DISPLAY.value = "Error";
      return;
    }

    const result = evaluateExpression(expr);

    // Handle weird results like division by 0
    if (!Number.isFinite(result)) {
      DISPLAY.value = "Error";
      return;
    }

    DISPLAY.value = String(result);
  } catch {
    DISPLAY.value = "Error";
  }
}

// --- Safe expression evaluator (Shunting-yard -> RPN) ---

function evaluateExpression(expr) {
  const tokens = tokenize(expr);
  const rpn = toRPN(tokens);
  return evalRPN(rpn);
}

function tokenize(expr) {
  const tokens = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    // skip spaces
    if (ch === " ") {
      i++;
      continue;
    }

    // number (supports decimals)
    if (/[0-9.]/.test(ch)) {
      let numStr = "";
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        numStr += expr[i++];
      }

      // reject invalid numbers like "1..2"
      if ((numStr.match(/\./g) || []).length > 1) throw new Error("Bad number");
      tokens.push({ type: "num", value: parseFloat(numStr) });
      continue;
    }

    // operators / parentheses
    if ("+-*/()".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }

    // anything else is invalid
    throw new Error("Invalid character");
  }

  // Handle unary minus: convert "-x" into "0 - x" when needed
  const fixed = [];
  for (let j = 0; j < tokens.length; j++) {
    const t = tokens[j];
    if (
      t.type === "op" &&
      t.value === "-" &&
      (j === 0 ||
        (tokens[j - 1].type === "op" && tokens[j - 1].value !== ")"))
    ) {
      fixed.push({ type: "num", value: 0 });
    }
    fixed.push(t);
  }

  return fixed;
}

function toRPN(tokens) {
  const output = [];
  const ops = [];

  const prec = { "+": 1, "-": 1, "*": 2, "/": 2 };

  for (const t of tokens) {
    if (t.type === "num") {
      output.push(t);
      continue;
    }

    const v = t.value;

    if (v === "(") {
      ops.push(v);
      continue;
    }

    if (v === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") {
        output.push({ type: "op", value: ops.pop() });
      }
      if (!ops.length) throw new Error("Mismatched parens");
      ops.pop(); // remove "("
      continue;
    }

    // operator
    while (
      ops.length &&
      "+-*/".includes(ops[ops.length - 1]) &&
      prec[ops[ops.length - 1]] >= prec[v]
    ) {
      output.push({ type: "op", value: ops.pop() });
    }
    ops.push(v);
  }

  while (ops.length) {
    const op = ops.pop();
    if (op === "(") throw new Error("Mismatched parens");
    output.push({ type: "op", value: op });
  }

  return output;
}

function evalRPN(rpn) {
  const stack = [];

  for (const t of rpn) {
    if (t.type === "num") {
      stack.push(t.value);
      continue;
    }

    const b = stack.pop();
    const a = stack.pop();
    if (a === undefined || b === undefined) throw new Error("Bad expression");

    switch (t.value) {
      case "+": stack.push(a + b); break;
      case "-": stack.push(a - b); break;
      case "*": stack.push(a * b); break;
      case "/": stack.push(a / b); break;
      default: throw new Error("Unknown operator");
    }
  }

  if (stack.length !== 1) throw new Error("Bad expression");
  return stack[0];
}
