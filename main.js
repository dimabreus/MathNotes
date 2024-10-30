const noteArea = document.getElementById('note-area');

const variables = {
  pi: Math.PI,
  e: Math.E
}

function preprocessExpression(expression) {
  Object.entries(variables).forEach(([key, value]) => {
    expression = expression.replaceAll(key, value);
  });

  return expression.replaceAll('^', '**');
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

  if (!right) {
    const result = tryEvaluateExpression(left);

    right = result || right
  }
  console.log(left, right)

  return [left, right].join(' = ');
}

function handleChange(lines) {
  const newLines = [];

  lines.forEach((line) => {
    const parse = tryParse(line);

    newLines.push(parse || line)
  });

  console.log(newLines)
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