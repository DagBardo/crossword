import { generateThemeWords } from "./modules/aiWordGenerator.js?v=7";
import { buildGrid } from "./modules/gridBuilder.js?v=7";
import { numberClues } from "./modules/clueNumberer.js?v=7";
import { CrosswordRenderer } from "./modules/crosswordRenderer.js?v=7";

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
  els.generateBtn.textContent = isBusy ? "Generating..." : "Generate new puzzle";
}

async function generatePuzzle() {
  const theme = els.themeInput.value.trim() || "general knowledge";
  const difficulty = Number(els.difficultySelect.value);
  const style = els.styleSelect.value;

  setBusy(true);
  els.status.textContent = `Generating ${style} puzzle for “${theme}”...`;

  try {
    const entries = await generateThemeWords({
      theme,
      difficulty,
      style,
      maxWords: 18
    });

    const built = buildGrid(entries, 9);
    const numbering = numberClues(built.grid, built.placements);

    renderer.render({
      theme,
      difficulty,
      style,
      entries,
      grid: built.grid,
      placements: built.placements,
      rejected: built.rejected,
      numbering
    });
  } catch (error) {
    console.error(error);
    els.status.textContent = `Could not generate puzzle: ${error.message}`;
  } finally {
    setBusy(false);
  }
}

els.generateBtn.addEventListener("click", generatePuzzle);
els.checkBtn.addEventListener("click", () => renderer.check());
els.revealBtn.addEventListener("click", () => renderer.reveal());
els.clearBtn.addEventListener("click", () => renderer.clear());

generatePuzzle();
