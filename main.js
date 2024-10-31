const noteArea = document.getElementById('note-area');

let variables = {}

function resetVariables() {
  variables = {
    pi: Math.PI,
    e: Math.E
  }
}

function solve(equations) {
  const names = {};
  const m = [];
  const b = [];
  const result = new Map();
  let size = 0;

  const gcd = (a, b) => (b ? gcd(b, a % b) : a);

  const simplify = (i) => {
    let g = 0;
    const currentRow = m[i];
    for (const x of currentRow) {
      g = x ? (g ? gcd(g, Math.abs(x)) : x) : g;
    }
    if (g && g > 1) {
      for (let j = 0; j <= size; ++j) {
        currentRow[j] /= g;
      }
    }
  };

  for (const eq of equations) {
    const line = [];
    let r = 0;
    const sides = eq.split('=');

    for (let i = 0; i < 2; i++) {
      const side = sides[i] || '0';
      side.match(/[+\-]?[a-z0-9]+/gi).forEach((part) => {
        const coef = (part[0] === '-' ? -1 : 1) * (1 - i * 2) * (part.match(/\d+/g) || [1])[0];
        const name = (part.match(/[a-z]+/g) || [])[0];

        if (name) {
          if (names[name] === undefined) names[name] = size++;
          line[names[name]] = (line[names[name]] || 0) + coef;
        } else {
          r -= coef;
        }
      });
    }

    m.push(line);
    b.push(r);
  }

  for (const s of m) {
    for (let j = 0; j < size; ++j) {
      if (!s[j]) {
        s[j] = 0;
      }
    }
    s[size] = b[m.indexOf(s)];
  }

  simplify(0);
  for (let i = 0; i < m.length; ++i) {
    const currentRow = m[i];
    const v = currentRow.findIndex((x) => x);
    if (v === -1) continue;

    for (let j = i + 1; j < m.length; ++j) {
      if (m[j][v]) {
        const g = gcd(Math.abs(currentRow[v]), Math.abs(m[j][v]));
        const a = currentRow[v] / g;
        const b = m[j][v] / g;
        for (let k = 0; k <= size; ++k) {
          m[j][k] = m[j][k] * a - currentRow[k] * b;
        }
        simplify(j);
      }
    }
  }

  for (let i = m.length - 1; i >= 0; --i) {
    if (!m[i].some((x) => x)) {
      m.splice(i, 1);
    } else if (!m[i].some((x, j) => x && j !== size)) {
      return null;
    }
  }

  if (m.length !== size) {
    return null;
  }

  for (let i = m.length - 1; i >= 0; --i) {
    let sum = 0;
    let nextName;

    for (const name in names) {
      if (m[i][names[name]]) {
        if (result.has(name)) {
          sum += result.get(name) * m[i][names[name]];
        } else {
          nextName = name;
        }
      }
    }

    result.set(nextName, (m[i][size] - sum) / m[i][names[nextName]]);
  }

  return result;
}

function preprocessExpression(expression) {
  expression = expression
    .replaceAll('^', '**')
    .replaceAll(' ', '');

  Object.entries(variables).reverse().forEach(([key, value]) => {
    Object.entries(variables).reverse().forEach(([key2, value2]) => {
      expression = expression.replaceAll(key + key2, value * value2)
        .replaceAll(key2 + key, value * value2);
    });
    expression = expression.replaceAll(new RegExp(`((?:\\d+\\.)?\\d+)${key}`, 'g'), `${value}*$1`)
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

  if (!right) {
    const result = tryEvaluateExpression(left);

    right = result || right;
  } else if (/^[a-zA-Z]+$/.test(left) && !variables[left]) {
    variables[left] = tryEvaluateExpression(right) || right;
  }

  return [left, right].join(' = ');
}

function handleChange(lines) {
  const newLines = [];

  resetVariables();

  lines.forEach(line => {
    tryParse(line);
  });

  try {
    const filteredLines = lines
      .filter(line => line.trim() && line.includes('=') && line.split('=').every(Boolean))
      .map(line => line.trim().replaceAll(' ', ''));
    const newVariables = solve(filteredLines);

    newVariables.entries().forEach(([key, value]) => {
      if (!variables[key]) {
        variables[key] = value;
      }
    });
  } catch { }

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

  if (parts.length <= 1) return; // If there aren't enough parts.

  if (parts[parts.length - 1]?.trim()?.length > 0) return; // If there are enough symbols to delete each symbol individually.

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