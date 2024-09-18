import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const Canvas = ({ undo, clear, onBlackPixelCountUpdate }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState([]); // Stack to store canvas states

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    contextRef.current = context;

    // Initialize the canvas with a white background
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Load the initial state from local storage
    const savedHistory = JSON.parse(localStorage.getItem("canvasHistory")) || [];
    if (savedHistory.length > 0) {
      restoreCanvas(savedHistory[savedHistory.length - 1]);
      setHistory(savedHistory);
    } else {
      // Save initial blank state to history if nothing in local storage
      setHistory([canvas.toDataURL()]);
      localStorage.setItem("canvasHistory", JSON.stringify([canvas.toDataURL()]));
    }
  }, []);

  useEffect(() => {
    if (undo) {
      handleUndo();
    }
  }, [undo]);

  useEffect(() => {
    if (clear) {
      handleClear();
    }
  }, [clear]);

  const handleUndo = () => {
    if (history.length > 1) {
      // Remove the last canvas state from history and restore the previous one
      const previousHistory = history.slice(0, -1);
      setHistory(previousHistory);
      restoreCanvas(previousHistory[previousHistory.length - 1]);
      localStorage.setItem("canvasHistory", JSON.stringify(previousHistory));
      updateBlackPixelData(); // Recalculate black pixels after undo
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;

    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Refill with white background
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Reset the history to a blank canvas state
    const blankState = canvas.toDataURL();
    setHistory([blankState]);
    localStorage.setItem("canvasHistory", JSON.stringify([blankState]));
    updateBlackPixelData(); // Ensure the black pixel count and coordinates are updated
  };

  const restoreCanvas = (dataUrl) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const previousImage = new Image();
    previousImage.src = dataUrl;
    previousImage.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before restoring
      context.drawImage(previousImage, 0, 0);
      updateBlackPixelData(); // Ensure the black pixel count and coordinates are updated
    };
  };

  const updateBlackPixelData = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let blackPixelCount = 0;
    const blackPixelCoordinates = [];

    for (let i = 0; i < pixels.length; i += 4) {
      const x = (i / 4) % canvas.width;
      const y = Math.floor(i / 4 / canvas.width);
      const red = pixels[i];
      const green = pixels[i + 1];
      const blue = pixels[i + 2];
      const alpha = pixels[i + 3];

      // Check if the pixel is black
      if (red === 0 && green === 0 && blue === 0 && alpha !== 0) {
        blackPixelCount++;
        blackPixelCoordinates.push({ x, y });
      }
    }

    // Call the callback function to update the black pixel count
    onBlackPixelCountUpdate(blackPixelCount);

    // Log the coordinates of black pixels
    console.log("Black Pixel Coordinates:", blackPixelCoordinates);
  };

  const startDrawing = (e) => {
    setMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const context = contextRef.current;

    context.beginPath();
    context.moveTo(mousePos.x, mousePos.y);
    context.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    context.stroke();
    context.closePath();

    setMousePos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Save the current canvas state to the history stack after drawing
    const canvas = canvasRef.current;
    const newState = canvas.toDataURL();
    setHistory((prevHistory) => [...prevHistory, newState]);
    localStorage.setItem("canvasHistory", JSON.stringify([...history, newState]));
    updateBlackPixelData(); // Ensure the black pixel count and coordinates are updated
  };

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={1000}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      className="canvas"
    />
  );
};

const Navbar = () => (
  <div className="navbar">
    <div className="nav-links">
      <button>BOOK-ROUGH</button>
    </div>
  </div>
);

const App = () => {
  const [text, setText] = useState("");
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const [undo, setUndo] = useState(false);
  const [clear, setClear] = useState(false);
  const [blackPixelCount, setBlackPixelCount] = useState(0);

  useEffect(() => {
    const savedText = localStorage.getItem("textareaValue");
    if (savedText) {
      setText(savedText);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("textareaValue", text);
  }, [text]);

  const handleTextChange = (e) => {
    console.log(e.target.value)
    setText(e.target.value);
  };

  const toggleCanvas = () => {
    setIsCanvasVisible(!isCanvasVisible);
  };

  const handleUndo = () => {
    setUndo(true);
    setTimeout(() => setUndo(false), 100);
  };

  const handleClear = () => {
    setClear(true);
    setTimeout(() => setClear(false), 100);
  };

  const handleBlackPixelCountUpdate = (count) => {
    setBlackPixelCount(count);
  };
  return (
    <div className="App">
      <Navbar />
      <button
        onClick={toggleCanvas}
        className="toggle-button"
      >
        {isCanvasVisible ? "Hide Canvas" : "Show Canvas"}
      </button>
      <div className={`canvas-button-container ${isCanvasVisible ? "visible" : "hidden"}`}>
        <div className="buttons">
          <button
            onClick={handleUndo}
            className={`undo-button ${isCanvasVisible ? "visible" : ""}`}
          >
            Undo
          </button>
          <button
            onClick={handleClear}
            className={`clear-button ${isCanvasVisible ? "visible" : ""}`}
          >
            Clear Canvas
          </button>
        </div>
        <Canvas undo={undo} clear={clear} onBlackPixelCountUpdate={handleBlackPixelCountUpdate} />
      </div>
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Type here..."
        className="text-area"
      />
      <div className="black-pixel-count">
        Black Pixel Count: {blackPixelCount}
      </div>
    </div>
  );
};

export default App;
