import Module from 'ffish-es6';

let ffish = null;

Module({
  locateFile: (path) => {
    // Ensure the .wasm is loaded from /ShogiApp/ffish.wasm
    if (path.endsWith('.wasm')) {
      return new URL('/ShogiApp/ffish.wasm', window.location.origin).toString();
    }
    return path;
  }
}).then((loadedModule) => {
  ffish = loadedModule;
  console.log("✅ ffish module loaded");
  console.log("Available variants:", ffish.variants?.() || "(null)");

  const player = document.getElementById("player");
  const sfenOutput = document.getElementById("sfen");
  const btn = document.getElementById("aiMove");
  const info = document.getElementById("info");

  if (!player || !sfenOutput || !btn || !info) {
    console.error("❌ DOM elements not found");
    return;
  }

  // Initial SFEN: standard starting position, Black to move
  const initialSfen = "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1";

  // Randomly assign human to Black (sente) or White (gote)
  const playerIsBlack = Math.random() < 0.5;
  const playerSide = playerIsBlack ? "b" : "w";
  const aiSide = playerIsBlack ? "w" : "b";
  console.log(`🎲 Player is ${playerIsBlack ? "Black (sente)" : "White (gote)"}`);
  console.log(`🤖 AI is ${aiSide === "b" ? "Black" : "White"}`);

  // Configure <shogi-player>:
  player.mode = "play";
  player.setAttribute("editable", "true"); 
  player.setAttribute("sfen", initialSfen);

  // Show which side you are and which side the AI is:
  info.innerText = `You are ${playerIsBlack ? "Black (sente)" : "White (gote)"}, AI is ${aiSide === "b" ? "Black" : "White"}`;

  // Whenever the SFEN changes (either your move or the AI’s move),
  // toggle editing and, if it’s AI’s turn, trigger AI move:
  player.addEventListener("update", (e) => {
    const newSfen = e.detail.sfen;
    sfenOutput.innerText = newSfen;
    console.log("📥 SFEN updated:", newSfen);

    // Determine whose turn it is from the SFEN: look for " w " or " b "
    if (newSfen.includes(` ${aiSide} `)) {
      // Disable user editing while AI thinks:
      player.setAttribute("editable", "false");

      // Give a tiny timeout so the board visually updates first,
      // then let the AI calculate its move:
      setTimeout(() => playAIMove(newSfen), 200);
    } else {
      // It's your turn → enable editing:
      player.setAttribute("editable", "true");
    }
  });

  // For manual testing, you can force an AI move:
  btn.addEventListener("click", () => {
    playAIMove(player.getAttribute("sfen"));
  });

  // Core AI‐move function:
  function playAIMove(sfen) {
    console.log("🎯 AI thinking on SFEN:", sfen);

    try {
      // Create a new ffish board from the current SFEN:
      const board = new ffish.Board("shogi", sfen);

      // List all legal moves:
      const legal = board.legalMoves().split(" ");
      console.log("🔍 Legal moves for AI:", legal);

      if (legal.length > 0) {
        // For now, AI just picks the first legal move:
        board.push(legal[0]);

        // Clean up any trailing "[...]" that ffish might inject:
        let newFen = board.fen().replace(/\[.*?\]/g, "").trim();
        console.log("🤖 AI move played. New SFEN:", newFen);

        // Update the board by setting the SFEN attribute:
        player.setAttribute("sfen", newFen);
      } else {
        console.warn("⚠️ No legal moves available for AI");
      }

      board.delete();
    } catch (err) {
      console.error("❌ Error during AI move:", err);
    }
  }

  // If the AI’s side is Black, it starts immediately:
  if (!playerIsBlack) {
    playAIMove(initialSfen);
  }
}).catch((err) => {
  console.error("❌ Failed to load ffish module:", err);
});
