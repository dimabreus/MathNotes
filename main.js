const noteArea = document.getElementById('note-area');

let variables = {}

function resetVariables() {
  variables = {
    pi: Math.PI,
    e: Math.E
  }
}

function preprocessExpression(expression) {
  expression = expression
    .replaceAll('^', '**')
    .replaceAll(' ', '');

  Object.entries(variables).forEach(([key, value]) => {
    Object.entries(variables).forEach(([key2, value2]) => {
      expression = expression.replaceAll(key + key2, value * value2)
        .replaceAll(key2 + key, value * value2);
    });
    expression = expression.replaceAll(new RegExp(`(\\d+)${key}`, 'g'), `${value}*$1`)
      .replaceAll(key, value);
  });

  return expression;
}

function tryEvaluateExpression(expression) {
  try {
    const result = parseFloat(eval(preprocessExpression(expression)).toFixed(3));
    return result;
  } catch {
    return false;
  }
}

function tryParse(line) {
  const sides = line.split('=');

  if (sides.length !== 2) return false;

  let [left, right] = sides.map(side => side.trim());

  if (/^[a-zA-Z]+$/.test(preprocessExpression(left)) && !Object.keys(variables).includes(left)) {
    variables[left] = tryEvaluateExpression(right) || right;
  } else if (!right) {
    const result = tryEvaluateExpression(left);

    right = result || right;
  }

  return [left, right].join(' = ');
}

function handleChange(lines) {
  const newLines = [];

  resetVariables();

  lines.forEach((line) => {
    const parse = tryParse(line);

    newLines.push(parse || line)
  });

  return newLines
}

noteArea.addEventListener('input', (e) => {
  const lines = e.target.value.split("\n");
  const newLines = handleChange(lines);

  noteArea.value = newLines.join('\n');
});

noteArea.addEventListener('keydown', (event) => {
  if (event.key !== 'Backspace') return;

  const start = noteArea.selectionStart;
  const end = noteArea.selectionEnd;
  const value = noteArea.value;

  if (start !== end) return; // If there are selected text.

  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', start);

  const line = value.slice(lineStart, lineEnd === -1 ? undefined : lineEnd);
  const parts = line.split('=');

  if (parts.length <= 1) return // If there aren't enough parts.

  event.preventDefault();

  const newLine = parts.slice(0, -1).join('=');
  const newValue = value.slice(0, lineStart) + newLine + (lineEnd === -1 ? '' : value.slice(lineEnd));
  noteArea.value = newValue;

  const newCursorPosition = lineStart + newLine.length;
  noteArea.setSelectionRange(newCursorPosition, newCursorPosition);
});

window.addEventListener('load', () => {
  resetVariables();
})