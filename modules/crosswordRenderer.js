export class CrosswordRenderer {
  constructor({ gridEl, acrossEl, downEl, statusEl, notesEl }) {
    this.gridEl = gridEl;
    this.acrossEl = acrossEl;
    this.downEl = downEl;
    this.statusEl = statusEl;
    this.notesEl = notesEl;
    this.state = null;
    this.activeWord = null;
  }

  render(puzzle) {
    this.state = puzzle;
    this.activeWord = null;
    this.renderGrid();
    this.renderClues();
    this.renderNotes();
    this.setStatus(`Puzzle ready: ${puzzle.placements.length} answers.`);
  }

  renderGrid() {
    const { grid, numbering } = this.state;
    this.gridEl.innerHTML = "";

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement("div");
        cell.className = grid[r][c] ? "cell" : "cell inactive";
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.dataset.solution = grid[r][c] || "";
        cell.dataset.value = "";
        cell.tabIndex = grid[r][c] ? 0 : -1;

        const number = numbering.numbers.get(`${r},${c}`);
        if (number) {
          const marker = document.createElement("span");
          marker.className = "number";
          marker.textContent = number;
          cell.appendChild(marker);
        }

        const letter = document.createElement("span");
        letter.className = "letter";
        cell.appendChild(letter);

        cell.addEventListener("click", () => this.selectCell(cell));
        cell.addEventListener("keydown", e => this.handleKeydown(e, cell));

        this.gridEl.appendChild(cell);
      }
    }
  }

  renderClues() {
    this.acrossEl.innerHTML = "";
    this.downEl.innerHTML = "";

    this.state.numbering.across.forEach(clue => {
      this.acrossEl.appendChild(this.makeClueItem(clue));
    });

    this.state.numbering.down.forEach(clue => {
      this.downEl.appendChild(this.makeClueItem(clue));
    });
  }

  renderNotes() {
    this.notesEl.innerHTML = "";

    const placed = [
      ...this.state.numbering.across,
      ...this.state.numbering.down
    ].sort((a, b) => a.number - b.number);

    placed.forEach(item => {
      const div = document.createElement("div");
      div.className = "note";
      div.innerHTML = `<strong>${item.answer}</strong>: ${item.note || "No note supplied."}`;
      this.notesEl.appendChild(div);
    });
  }

  makeClueItem(clue) {
    const li = document.createElement("li");
    li.dataset.row = clue.row;
    li.dataset.col = clue.col;
    li.dataset.direction = clue.direction;
    li.innerHTML = `<span class="clue-number">${clue.number}.</span>${clue.clue}`;
    li.addEventListener("click", () => this.highlightWord(clue));
    return li;
  }

  handleKeydown(event, cell) {
    if (cell.classList.contains("inactive")) return;

    const key = event.key;

    if (/^[a-zA-Z]$/.test(key)) {
      event.preventDefault();
      this.setCellValue(cell, key.toUpperCase());
      this.moveFrom(cell, this.activeWord?.direction || "across", 1);
      return;
    }

    if (key === "Backspace" || key === "Delete") {
      event.preventDefault();
      this.setCellValue(cell, "");
      return;
    }

    const map = {
      ArrowRight: ["across", 1],
      ArrowLeft: ["across", -1],
      ArrowDown: ["down", 1],
      ArrowUp: ["down", -1]
    };

    if (map[key]) {
      event.preventDefault();
      const [direction, delta] = map[key];
      this.moveFrom(cell, direction, delta);
    }
  }

  setCellValue(cell, value) {
    cell.dataset.value = value;
    cell.querySelector(".letter").textContent = value;
    cell.classList.remove("correct", "incorrect");
  }

  selectCell(cell) {
    this.gridEl.querySelectorAll(".cell").forEach(c => {
      c.classList.remove("selected");
    });

    cell.classList.add("selected");
    cell.focus({ preventScroll: true });
  }

  moveFrom(cell, direction, delta) {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const dr = direction === "down" ? delta : 0;
    const dc = direction === "across" ? delta : 0;

    const next = this.gridEl.querySelector(
      `.cell[data-row="${row + dr}"][data-col="${col + dc}"]:not(.inactive)`
    );

    if (next) {
      this.selectCell(next);
    }
  }

  highlightWord(clue) {
    this.activeWord = clue;

    this.gridEl.querySelectorAll(".cell").forEach(cell => {
      cell.classList.remove("word");
    });

    document.querySelectorAll(".clues li").forEach(li => {
      li.classList.remove("active");
    });

    const dr = clue.direction === "down" ? 1 : 0;
    const dc = clue.direction === "across" ? 1 : 0;

    for (let i = 0; i < clue.answer.length; i++) {
      const cell = this.gridEl.querySelector(
        `.cell[data-row="${clue.row + dr * i}"][data-col="${clue.col + dc * i}"]`
      );

      if (cell) {
        cell.classList.add("word");
      }
    }

    const clueItem = document.querySelector(
      `li[data-row="${clue.row}"][data-col="${clue.col}"][data-direction="${clue.direction}"]`
    );

    if (clueItem) {
      clueItem.classList.add("active");
    }

    const first = this.gridEl.querySelector(
      `.cell[data-row="${clue.row}"][data-col="${clue.col}"]`
    );

    if (first) {
      this.selectCell(first);
    }
  }

  check() {
    let filled = 0;
    let correct = 0;
    let total = 0;

    this.gridEl.querySelectorAll(".cell:not(.inactive)").forEach(cell => {
      total++;
      cell.classList.remove("correct", "incorrect");

      const value = cell.dataset.value || "";
      const solution = cell.dataset.solution || "";

      if (!value) return;

      filled++;

      if (value === solution) {
        correct++;
        cell.classList.add("correct");
      } else {
        cell.classList.add("incorrect");
      }
    });

    if (correct === total && total > 0) {
      this.setStatus(`Puzzle complete: ${correct}/${total} squares correct.`);
    } else {
      this.setStatus(`${correct}/${total} correct; ${filled}/${total} filled.`);
    }
  }

  reveal() {
    this.gridEl.querySelectorAll(".cell:not(.inactive)").forEach(cell => {
      const solution = cell.dataset.solution || "";
      this.setCellValue(cell, solution);
      cell.classList.add("correct");
    });

    this.setStatus("Puzzle revealed.");
  }

  clear() {
    this.gridEl.querySelectorAll(".cell:not(.inactive)").forEach(cell => {
      this.setCellValue(cell, "");
      cell.classList.remove("correct", "incorrect");
    });

    this.setStatus("Cleared.");
  }

  setStatus(message) {
    this.statusEl.textContent = message;
  }
}
