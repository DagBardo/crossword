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

  return crosses * 20 - centerPenalty;
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

function firstPlacements(entry, size) {
  const spots = [];

  for (const direction of ["across", "down"]) {
    const maxRow = direction === "across" ? size - 1 : size - entry.answer.length;
    const maxCol = direction === "across" ? size - entry.answer.length : size - 1;

    for (let row = 0; row <= maxRow; row++) {
      for (let col = 0; col <= maxCol; col++) {
        const centerRow = row + (direction === "down" ? Math.floor(entry.answer.length / 2) : 0);
        const centerCol = col + (direction === "across" ? Math.floor(entry.answer.length / 2) : 0);
        const centerPenalty = Math.abs(centerRow - 4) + Math.abs(centerCol - 4);

        spots.push({ row, col, direction, score: -centerPenalty });
      }
    }
  }

  return spots.sort((a, b) => b.score - a.score).slice(0, 6);
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

function buildOne(entries, firstEntry, firstSpot, size) {
  let grid = makeEmptyGrid(size);
  const placements = [];
  const rejected = [];

  let placed = placeWord(grid, firstEntry, firstSpot.row, firstSpot.col, firstSpot.direction);
  grid = placed.grid;
  placements.push(placed.placement);

  const remaining = entries.filter(e => e.answer !== firstEntry.answer);

  let progress = true;

  while (progress && placements.length < 10) {
    progress = false;

    let best = null;

    for (const entry of remaining) {
      if (placements.some(p => p.answer === entry.answer)) continue;
      if (rejected.some(r => r.answer === entry.answer)) continue;

      const candidates = possiblePlacements(grid, entry);

      if (candidates.length) {
        const candidate = candidates[0];

        if (!best || candidate.score > best.candidate.score) {
          best = { entry, candidate };
        }
      }
    }

    if (best) {
      placed = placeWord(
        grid,
        best.entry,
        best.candidate.row,
        best.candidate.col,
        best.candidate.direction
      );

      grid = placed.grid;
      placements.push(placed.placement);
      progress = true;
    }
  }

  for (const entry of entries) {
    if (!placements.some(p => p.answer === entry.answer)) {
      rejected.push(entry);
    }
  }

  return { grid, placements, rejected };
}

export function buildGrid(entries, size = SIZE) {
  const usable = entries
    .filter(entry => entry.answer.length >= 3)
    .filter(entry => entry.answer.length <= size)
    .sort((a, b) => a.answer.length - b.answer.length);

  if (!usable.length) {
    return {
      grid: makeEmptyGrid(size),
      placements: [],
      rejected: entries
    };
  }

  let best = null;

  for (const firstEntry of usable) {
    for (const firstSpot of firstPlacements(firstEntry, size)) {
      const candidate = buildOne(usable, firstEntry, firstSpot, size);

      if (!best || candidate.placements.length > best.placements.length) {
        best = candidate;
      }

      if (candidate.placements.length >= 9) {
        return candidate;
      }
    }
  }

  return best;
}
