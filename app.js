import { generateThemeWords } from "./modules/aiWordGenerator.js";
import { buildGrid } from "./modules/gridBuilder.js";
import { numberClues } from "./modules/clueNumberer.js";
import { CrosswordRenderer } from "./modules/crosswordRenderer.js";

const els = {
  themeInput: document.getElementById("themeInput"),
  difficultySelect: document.getElementById("difficultySelect"),
  styleSelect: document.getElementById("styleSelect"),
  generateBtn: document.getElementById("generateBtn"),
  checkBtn: document.getElementById("checkBtn"),
  revealBtn: document.getElementById("revealBtn"),
  clearBtn: document.getElementById("clearBtn"),
  grid: document.getElementById("grid"),
  acrossClues: document.getElementById("acrossClues"),
  downClues: document.getElementById("downClues"),
  status: document.getElementById("status"),
  answerNotes: document.getElementById("answerNotes")
};

const renderer = new CrosswordRenderer({
  gridEl: els.grid,
  acrossEl: els.acrossClues,
  downEl: els.downClues,
  statusEl: els.status,
  notesEl: els.answerNotes
});

function setBusy(isBusy) {
  els.generateBtn.disabled = isBusy;
  els.generateBtn.textContent = isBusy
    ? "Generating..."
    : "Generate new puzzle";
}

async function generatePuzzle() {
  const theme = els.themeInput.value.trim() || "general knowledge";
  const difficulty = Number(els.difficultySelect.value);
  const style = els.styleSelect.value;

  setBusy(true);
  els.status.textContent = `Generating ${style} puzzle for “${theme}”...`;

  try {
let best = null;

for (let attempt = 1; attempt <= 3; attempt++) {
  els.status.textContent = `Generating ${style} puzzle for “${theme}”... attempt ${attempt}/3`;

  const entries = await generateThemeWords({
    theme,
    difficulty,
    style,
    maxWords: 18
  });

  const built = buildGrid(entries, 9);
  const numbering = numberClues(built.grid, built.placements);

  const candidate = {
    entries,
    built,
    numbering,
    placedCount: built.placements.length
  };

  if (!best || candidate.placedCount > best.placedCount) {
    best = candidate;
  }

  if (candidate.placedCount >= 7) {
    break;
  }
}

renderer.render({
  theme,
  difficulty,
  style,
  entries: best.entries,
  ...best.built,
  numbering: best.numbering
});

    renderer.render({
      theme,
      difficulty,
      style,
      entries,
      ...built,
      numbering
    });
  } catch (error) {
    console.error(error);
    els.status.textContent = "Could not generate puzzle.";
  } finally {
    setBusy(false);
  }
}

els.generateBtn.addEventListener("click", generatePuzzle);
els.checkBtn.addEventListener("click", () => renderer.check());
els.revealBtn.addEventListener("click", () => renderer.reveal());
els.clearBtn.addEventListener("click", () => renderer.clear());

generatePuzzle();
