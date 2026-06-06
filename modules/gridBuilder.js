const SIZE = 9;

function makeEmptyGrid(size = SIZE) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function cloneGrid(grid) {
  return grid.map(row => row.slice());
}

function canPlace(grid, word, row, col, direction, requireCross = true) {
  const size = grid.length;
  const dr = direction === "down" ? 1 : 0;
  const dc = direction === "across" ? 1 : 0;

  if (row < 0 || col < 0) return false;

  const endRow = row + dr * (word.length - 1);
  const endCol = col + dc * (word.length - 1);

  if (endRow >= size || endCol >= size) return false;

  let crosses = 0;

  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const existing = grid[r][c];

    if (existing && existing !== word[i]) return false;
    if (existing === word[i]) crosses++;
  }

  return requireCross ? crosses > 0 : true;
}

function scorePlacement(grid, word, row, col, direction) {
  const dr = direction === "down" ? 1 : 0;
  const dc = direction === "across" ? 1 : 0;

  let crosses = 0;

  for (let i = 0; i < word.length; i++) {
    if (grid[row + dr * i][col + dc * i] === word[i]) crosses++;
  }

  const centerRow = row + dr * Math.floor(word.length / 2);
  const centerCol = col + dc * Math.floor(word.length / 2);
  const centerPenalty = Math.abs(centerRow - 4) + Math.abs(centerCol - 4);

  return crosses * 10 - centerPenalty;
}

function placeWord(grid, entry, row, col, direction) {
  const next = cloneGrid(grid);
  const dr = direction === "down" ? 1 : 0;
  const dc = direction === "across" ? 1 : 0;

  for (let i = 0; i < entry.answer.length; i++) {
    next[row + dr * i][col + dc * i] = entry.answer[i];
  }

  return {
    grid: next,
    placement: {
      ...entry,
      row,
      col,
      direction,
      length: entry.answer.length
    }
  };
}

function firstPlacement(entry, size) {
  const direction = entry.answer.length >= 7 ? "across" : "down";
  const row = direction === "across"
    ? Math.floor(size / 2)
    : Math.max(0, Math.floor((size - entry.answer.length) / 2));

  const col = direction === "across"
    ? Math.max(0, Math.floor((size - entry.answer.length) / 2))
    : Math.floor(size / 2);

  return { row, col, direction };
}

function possiblePlacements(grid, entry) {
  const word = entry.answer;
  const size = grid.length;
  const candidates = [];

  for (let wi = 0; wi < word.length; wi++) {
    const letter = word[wi];

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== letter) continue;

        for (const direction of ["across", "down"]) {
          const row = direction === "across" ? r : r - wi;
          const col = direction === "across" ? c - wi : c;

          if (canPlace(grid, word, row, col, direction, true)) {
            candidates.push({
              row,
              col,
              direction,
              score: scorePlacement(grid, word, row, col, direction)
            });
          }
        }
      }
    }
  }

  return candidates.sort((a, b) => b.score - a.score);
}

export function buildGrid(entries, size = SIZE) {
  let grid = makeEmptyGrid(size);
  const placements = [];
  const rejected = [];

  const usable = entries
    .filter(entry => entry.answer.length >= 3)
    .filter(entry => entry.answer.length <= size)
    .sort((a, b) => b.answer.length - a.answer.length);

  if (!usable.length) {
    return { grid, placements, rejected: entries };
  }

  const first = usable[0];
  const fp = firstPlacement(first, size);
  let placed = placeWord(grid, first, fp.row, fp.col, fp.direction);

  grid = placed.grid;
  placements.push(placed.placement);

  for (const entry of usable.slice(1)) {
    const candidates = possiblePlacements(grid, entry);

    if (!candidates.length) {
      rejected.push(entry);
      continue;
    }

    const chosen = candidates[0];
    placed = placeWord(grid, entry, chosen.row, chosen.col, chosen.direction);

    grid = placed.grid;
    placements.push(placed.placement);

    if (placements.length >= 10) break;
  }

  return { grid, placements, rejected };
}
