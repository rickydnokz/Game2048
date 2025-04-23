document.addEventListener('DOMContentLoaded', async () => {
    // Game state
    let grid = [];
    let score = 0;
    let contract;
    let provider;
    let signer;
    let contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
    const contractABI = [/* Paste your contract ABI here */];
    
    // Initialize game
    initGame();
    
    // Connect Wallet
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    
    // New Game
    document.getElementById('newGame').addEventListener('click', initGame);
    
    // Submit Score
    document.getElementById('submitScore').addEventListener('click', submitScore);
    
    // Claim Prize
    document.getElementById('claimPrize').addEventListener('click', claimPrize);
    
    // Keyboard controls
    document.addEventListener('keydown', handleKeyPress);
    
    async function connectWallet() {
      if (window.ethereum) {
        try {
          provider = new ethers.BrowserProvider(window.ethereum);
          await provider.send("eth_requestAccounts", []);
          signer = await provider.getSigner();
          contract = new ethers.Contract(contractAddress, contractABI, signer);
          
          const address = await signer.getAddress();
          document.getElementById('walletAddress').textContent = `Connected: ${address.substring(0, 6)}...${address.substring(38)}`;
          
          // Load high score
          const highScore = await contract.highScores(address);
          document.getElementById('highScore').textContent = `Your high score: ${highScore}`;
          
          // Enable buttons
          document.getElementById('submitScore').disabled = false;
          document.getElementById('claimPrize').disabled = false;
          
        } catch (error) {
          console.error("Error connecting wallet:", error);
        }
      } else {
        alert("Please install MetaMask!");
      }
    }
    
    function initGame() {
      grid = Array(4).fill().map(() => Array(4).fill(0));
      score = 0;
      updateScore();
      addRandomTile();
      addRandomTile();
      renderGrid();
    }
    
    function renderGrid() {
      const gridElement = document.getElementById('grid');
      gridElement.innerHTML = '';
      
      for (let i = 0; i < 4; i++) {
        const rowElement = document.createElement('div');
        rowElement.className = 'grid-row';
        
        for (let j = 0; j < 4; j++) {
          const cellElement = document.createElement('div');
          cellElement.className = 'grid-cell';
          
          if (grid[i][j] !== 0) {
            cellElement.textContent = grid[i][j];
            cellElement.classList.add(`tile-${grid[i][j]}`);
          }
          
          rowElement.appendChild(cellElement);
        }
        
        gridElement.appendChild(rowElement);
      }
    }
    
    function addRandomTile() {
      const emptyCells = [];
      
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (grid[i][j] === 0) {
            emptyCells.push({i, j});
          }
        }
      }
      
      if (emptyCells.length > 0) {
        const {i, j} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid[i][j] = Math.random() < 0.9 ? 2 : 4;
      }
    }
    
    function moveTiles(direction) {
      let moved = false;
      
      // Clone grid to compare
      const oldGrid = grid.map(row => [...row]);
      
      // Process movement based on direction
      if (direction === 'left') {
        for (let i = 0; i < 4; i++) {
          grid[i] = slideRow(grid[i]);
        }
      } else if (direction === 'right') {
        for (let i = 0; i < 4; i++) {
          grid[i] = slideRow(grid[i].reverse()).reverse();
        }
      } else if (direction === 'up') {
        for (let j = 0; j < 4; j++) {
          let column = [grid[0][j], grid[1][j], grid[2][j], grid[3][j]];
          column = slideRow(column);
          for (let i = 0; i < 4; i++) {
            grid[i][j] = column[i];
          }
        }
      } else if (direction === 'down') {
        for (let j = 0; j < 4; j++) {
          let column = [grid[3][j], grid[2][j], grid[1][j], grid[0][j]];
          column = slideRow(column);
          for (let i = 0; i < 4; i++) {
            grid[3 - i][j] = column[i];
          }
        }
      }
      
      // Check if grid changed
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (grid[i][j] !== oldGrid[i][j]) {
            moved = true;
            break;
          }
        }
        if (moved) break;
      }
      
      if (moved) {
        addRandomTile();
        renderGrid();
        checkGameOver();
      }
    }
    
    function slideRow(row) {
      // Remove zeros
      let filtered = row.filter(x => x !== 0);
      
      // Merge tiles
      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
          filtered[i] *= 2;
          filtered[i + 1] = 0;
          score += filtered[i];
          updateScore();
        }
      }
      
      // Remove zeros again
      filtered = filtered.filter(x => x !== 0);
      
      // Add zeros back
      while (filtered.length < 4) {
        filtered.push(0);
      }
      
      return filtered;
    }
    
    function updateScore() {
      document.getElementById('score').textContent = score;
    }
    
    function checkGameOver() {
      // Check for 2048 tile
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (grid[i][j] === 2048) {
            alert("You won! Submit your score to the blockchain!");
            return;
          }
        }
      }
      
      // Check for possible moves
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (grid[i][j] === 0) return;
          if (j < 3 && grid[i][j] === grid[i][j + 1]) return;
          if (i < 3 && grid[i][j] === grid[i + 1][j]) return;
        }
      }
      
      alert("Game Over!");
    }
    
    function handleKeyPress(e) {
      if ([37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
        
        if (e.keyCode === 37) moveTiles('left');
        if (e.keyCode === 38) moveTiles('up');
        if (e.keyCode === 39) moveTiles('right');
        if (e.keyCode === 40) moveTiles('down');
      }
    }
    
    async function submitScore() {
      try {
        const tx = await contract.submitScore(score, { value: ethers.parseEther("0.01") });
        await tx.wait();
        alert("Score submitted to blockchain!");
        
        // Update high score display
        const address = await signer.getAddress();
        const highScore = await contract.highScores(address);
        document.getElementById('highScore').textContent = `Your high score: ${highScore}`;
        
      } catch (error) {
        console.error("Error submitting score:", error);
        alert("Error submitting score: " + error.message);
      }
    }
    
    async function claimPrize() {
      try {
        const tx = await contract.claimPrize();
        await tx.wait();
        alert("Prize claimed!");
      } catch (error) {
        console.error("Error claiming prize:", error);
        alert("Error claiming prize: " + error.message);
      }
    }
  });