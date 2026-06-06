export function numberClues(grid, placements) {
  const numbers = new Map();
  const across = [];
  const down = [];
  let n = 1;

  const sorted = [...placements].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  for (const placement of sorted) {
    const key = `${placement.row},${placement.col}`;

    let number;

    if (numbers.has(key)) {
      number = numbers.get(key);
    } else {
      number = n++;
      numbers.set(key, number);
    }

    const clue = {
      number,
      ...placement
    };

    if (placement.direction === "across") {
      across.push(clue);
    } else {
      down.push(clue);
    }
  }

  across.sort((a, b) => a.number - b.number);
  down.sort((a, b) => a.number - b.number);

  return {
    numbers,
    across,
    down
  };
}
