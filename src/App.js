import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [coordinates, setCoordinates] = useState([]);
  const [plotMode, setPlotMode] = useState(false);
  const [referencePoints, setReferencePoints] = useState({ x1: null, x2: null, y1: null, y2: null });
  const [isReferenceSet, setIsReferenceSet] = useState(false);
  const [actualCoordinates, setActualCoordinates] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });
  const [showModal, setShowModal] = useState(false);
  const maxCanvasWidth = 800;  // Adjust these values based on your requirements
  const maxCanvasHeight = 600;

  const calculateTransformations = () => {
    if (referencePoints.x1 && referencePoints.x2 && referencePoints.y1 && referencePoints.y2) {
      const scaleX = (actualCoordinates.x2 - actualCoordinates.x1) / (referencePoints.x2.x - referencePoints.x1.x);
      const scaleY = (actualCoordinates.y2 - actualCoordinates.y1) / (referencePoints.y2.y - referencePoints.y1.y);
      const offsetX = actualCoordinates.x1 - referencePoints.x1.x * scaleX;
      const offsetY = actualCoordinates.y1 - referencePoints.y1.y * scaleY;
  
      return { scaleX, scaleY, offsetX, offsetY };
    }
    return null;
  };
  

  const canvasRef = useRef(null);

  const plotPoint = (canvasX, canvasY) => {
    const transformations = calculateTransformations();
    if (transformations) {
      const { scaleX, scaleY, offsetX, offsetY } = transformations;
      const transformedX = canvasX * scaleX + offsetX;
      const transformedY = canvasY * scaleY + offsetY;
    
      // Use transformedX and transformedY as the coordinates for plotting
      return { x: transformedX, y: transformedY };
    }
    return null;
  };

  

  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
  
    reader.onload = (event) => {
      setImage(event.target.result);
  
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          // Calculate the new scale to fit the image within the maximum dimensions
          const scale = Math.min(maxCanvasWidth / img.width, maxCanvasHeight / img.height);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
  
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Calculate the top-left corner position to center the image
          const x = (maxCanvasWidth - canvas.width) / 2;
          const y = (maxCanvasHeight - canvas.height) / 2;
  
          ctx.drawImage(img, x, y, canvas.width, canvas.height);
        }
      };
      img.src = event.target.result;
    };
  
    if (file) {
      reader.readAsDataURL(file);
    }
  };


  const handleCanvasClick = (e) => {
    if (!plotMode) return;
  
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    let newPoint = null;
    let label = '';
  
    if (!referencePoints.x1) {
      setReferencePoints(points => ({ ...points, x1: { x, y } }));
      label = 'x1';
    } else if (!referencePoints.x2) {
      setReferencePoints(points => ({ ...points, x2: { x, y } }));
      label = 'x2';
    } else if (!referencePoints.y1) {
      setReferencePoints(points => ({ ...points, y1: { x, y } }));
      label = 'y1';
    } else if (!referencePoints.y2) {
      setReferencePoints(points => ({ ...points, y2: { x, y } }));
      setIsReferenceSet(true);
      label = 'y2';
      setShowModal(true);
    } else if (isReferenceSet) {
      newPoint = plotPoint(x, y);
    }
  
    if (label) {
      drawPointWithLabel(x, y, label);
    } else if (newPoint) {
      setCoordinates(prevCoordinates => [...prevCoordinates, newPoint]);
      drawPoint(x, y);
    }
  };
  
  
  

  const drawPoint = (x, y, color) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(x - 2, y - 2, 4, 4);
    }
  };

  const drawPointWithLabel = (x, y, label) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'red';
      ctx.fillRect(x - 2, y - 2, 4, 4);
      ctx.font = "12px Arial";
      ctx.fillText(label, x + 5, y);
    }
  };
  


  const showCoordinates = () => {
    const relCoordinates = coordinates.map(coord => {
      return {
        x: coord.x - referencePoints.x1,
        y: coord.y - referencePoints.y1
      };
    });
  
    // You can display these coordinates as needed
    console.log(relCoordinates);
  };


  // Reset function
  const resetPoints = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Clear the canvas
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // If there's an image, redraw it on the canvas
      if (image) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = image;
      }
    }
  
    // Reset state variables
    setReferencePoints({ x1: null, x2: null, y1: null, y2: null });
    setCoordinates([]);
    setIsReferenceSet(false);
  };
  
  // Button in the return statement
  <button onClick={resetPoints}>Reset Points</button>

  function CoordinateModal({ onClose, onSave, defaultValues }) {
    const [values, setValues] = useState(defaultValues);
    const [position, setPosition] = useState({ x: 100, y: 100 }); // Initial position
    const modalRef = useRef(null);

    const handleMouseDown = (e) => {
      const modal = modalRef.current;
      if (modal) {
        const startX = e.pageX - modal.offsetLeft;
        const startY = e.pageY - modal.offsetTop;
    
        const handleMouseMove = (moveEvent) => {
          const newX = moveEvent.pageX - startX;
          const newY = moveEvent.pageY - startY;
          setPosition({ x: newX, y: newY });
        };
    
        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
    
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    };

    const handleChange = (event) => {
      setValues({ ...values, [event.target.name]: parseFloat(event.target.value) });
    };

    const handleSubmit = () => {
      onSave(values);
      onClose();
    };

    return (
      <div className="modal" ref={modalRef} onMouseDown={handleMouseDown} style={{ left: position.x, top: position.y }}>
        <div className="modal-content">
          <span className="close" onClick={onClose}>&times;</span>
          <h2>Enter Actual Coordinates</h2>
          {Object.keys(values).map(key => (
            <div key={key}>
              <label>{key.toUpperCase()}: </label>
              <input type="number" name={key} value={values[key]} onChange={handleChange} />
            </div>
          ))}
          <button onClick={handleSubmit}>Save</button>
        </div>
      </div>
    );
  }


  const redrawCanvasWithNewPoints = (newCoordinates) => {
    const canvas = canvasRef.current;
    if (canvas && image) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Redraw image
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
        // Redraw points
        newCoordinates.forEach(coord => {
          drawPoint(coord.x, coord.y);
        });
  
        // Redraw reference points with labels
        Object.entries(referencePoints).forEach(([label, point]) => {
          if (point) {
            drawPointWithLabel(point.x, point.y, label);
          }
        });
      };
      img.src = image;
    }
  };

  
  
  

  return (
    <div>
      <input type="file" onChange={handleImageChange} accept="image/*" />
      <br />
      <div className="canvas-container">
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={500} 
          onClick={handleCanvasClick}
          style={{ border: '1px solid black', display: image ? 'block' : 'none' }}
        />
      </div>
      <ul>
        {coordinates.map((coord, index) => (
          <li key={index}>Coordinates: ({coord.x}, {coord.y})</li>
        ))}
      </ul>
      <button onClick={() => setPlotMode(!plotMode)}>
        {plotMode ? 'Stop Plotting' : 'Start Plotting'}
      </button>
      <button onClick={showCoordinates} disabled={!isReferenceSet}>
        Show Coordinates
      </button>
      <button onClick={resetPoints}>Reset Points</button>
      {/* ... Rest of your component ... */}

      {showModal && (
        <CoordinateModal
          defaultValues={actualCoordinates}
          onClose={() => setShowModal(false)}
          onSave={(values) => {
            setActualCoordinates(values);
            setShowModal(false);

            // Optional: Recalculate and re-plot points
            // This depends on whether you want the points to be re-plotted immediately
            // after changing the actual coordinates.
            const recalculatedCoordinates = coordinates.map(coord => {
              const transformedPoint = plotPoint(coord.x, coord.y);
              return transformedPoint || coord;
            });
            setCoordinates(recalculatedCoordinates);

            // Optional: Redraw the canvas with new points
            redrawCanvasWithNewPoints(recalculatedCoordinates);
          }}
  />
)}

    </div>
  );
  
}

export default App;
