import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const Canvas = ({ undo, clear }) => {
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

    // Save initial blank state to history
    setHistory([canvas.toDataURL()]);
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
    setHistory([canvas.toDataURL()]);
  };

  const restoreCanvas = (dataUrl) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const previousImage = new Image();
    previousImage.src = dataUrl;
    previousImage.onload = () => context.drawImage(previousImage, 0, 0);
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
    setHistory((prevHistory) => [...prevHistory, canvas.toDataURL()]);
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
      <button>Home</button>
      <button>File</button>
    </div>
  </div>
);

const App = () => {
  const [text, setText] = useState("");
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const [undo, setUndo] = useState(false);
  const [clear, setClear] = useState(false);

  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  const toggleCanvas = () => {
    setIsCanvasVisible(!isCanvasVisible);
  };

  const handleUndo = () => {
    setUndo(true);
    setTimeout(() => setUndo(false), 100); // Briefly trigger the undo action
  };

  const handleClear = () => {
    setClear(true);
    setTimeout(() => setClear(false), 100); // Briefly trigger the clear action
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
        <Canvas undo={undo} clear={clear} />
      </div>
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Type here..."
        className="text-area"
      />
    </div>
  );
};

export default App;
