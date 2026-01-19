import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Environment } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';

function Model({ geometry, transformMode, scale, onScaleChange }) {
  const meshRef = useRef();
  const transformRef = useRef();

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.set(scale, scale, scale);
    }
  }, [scale]);

  useEffect(() => {
    if (transformRef.current) {
      const controls = transformRef.current;
      const callback = () => {
        if (meshRef.current && onScaleChange) {
          const s = meshRef.current.scale;
          const uniformScale = (s.x + s.y + s.z) / 3;
          onScaleChange(uniformScale);
        }
      };
      controls.addEventListener('change', callback);
      return () => controls.removeEventListener('change', callback);
    }
  }, [onScaleChange]);

  return (
    <>
      <mesh ref={meshRef} geometry={geometry} scale={[scale, scale, scale]}>
        <meshPhysicalMaterial
          color="#6B8DD6"
          metalness={0.1}
          roughness={0.3}
          clearcoat={0.8}
          clearcoatRoughness={0.2}
          envMapIntensity={1}
        />
      </mesh>
      <TransformControls
        ref={transformRef}
        object={meshRef}
        mode={transformMode}
        showX={true}
        showY={true}
        showZ={true}
      />
    </>
  );
}

function CameraController({ geometry, orbitControlsRef, triggerHome }) {
  const { camera } = useThree();

  useEffect(() => {
    const goToHomeView = () => {
      if (geometry && geometry.boundingBox && orbitControlsRef.current) {
        const box = geometry.boundingBox;
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z);

        // Distance basée sur le FOV pour bien cadrer le modèle
        const fov = camera.fov * (Math.PI / 180);
        const distance = (maxDim / 2) / Math.tan(fov / 2) * 1.5;

        // Position caméra: vue 3/4 isométrique
        camera.position.set(
          center.x + distance * 0.7,
          center.y + distance * 0.5,
          center.z + distance * 0.7
        );

        // Cibler le centre du modèle
        orbitControlsRef.current.target.set(center.x, center.y, center.z);
        orbitControlsRef.current.update();

        camera.updateProjectionMatrix();
      }
    };

    goToHomeView();
  }, [geometry, camera, orbitControlsRef, triggerHome]);

  return null;
}

function BuildPlate({ size }) {
  return (
    <group>
      {/* Grille horizontale sur le plateau (Y = 0) */}
      <gridHelper
        args={[size, Math.floor(size / 10), '#3d3d5c', '#2a2a3e']}
      />
    </group>
  );
}

function STLViewer({ fileData, onModelLoad }) {
  const [geometry, setGeometry] = useState(null);
  const [transformMode, setTransformMode] = useState('translate');
  const [originalDimensions, setOriginalDimensions] = useState(null);
  const [scale, setScale] = useState(1);
  const [editingDim, setEditingDim] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [triggerHome, setTriggerHome] = useState(0);
  const orbitControlsRef = useRef();

  const handleHomeClick = () => {
    setTriggerHome(prev => prev + 1);
  };

  useEffect(() => {
    if (fileData) {
      const loader = new STLLoader();
      const geom = loader.parse(fileData);

      // Rotation pour aligner Z-up (STL) vers Y-up (Three.js)
      geom.rotateX(-Math.PI / 2);

      geom.computeBoundingBox();
      geom.center();

      // Repositionner le modèle sur le plateau (Y = 0)
      const box = geom.boundingBox;
      const height = box.max.y - box.min.y;
      geom.translate(0, height / 2, 0);

      setGeometry(geom);

      // Recalculer la bounding box après transformations
      geom.computeBoundingBox();
      const newBox = geom.boundingBox;
      const dims = {
        x: Math.abs(newBox.max.x - newBox.min.x),
        y: Math.abs(newBox.max.z - newBox.min.z), // Y dans STL = Z dans Three.js
        z: Math.abs(newBox.max.y - newBox.min.y)  // Z dans STL = Y dans Three.js (hauteur)
      };
      setOriginalDimensions(dims);
      setScale(1);

      if (onModelLoad) {
        onModelLoad(geom);
      }
    }
  }, [fileData, onModelLoad]);

  const handleScaleChange = useCallback((newScale) => {
    setScale(newScale);
  }, []);

  const resetScale = () => {
    setScale(1);
  };

  const currentDimensions = useMemo(() => {
    if (!originalDimensions) return null;
    return {
      x: originalDimensions.x * scale,
      y: originalDimensions.y * scale,
      z: originalDimensions.z * scale
    };
  }, [originalDimensions, scale]);

  const handleDimensionEdit = (axis) => {
    if (currentDimensions) {
      setEditingDim(axis);
      setEditValue(currentDimensions[axis].toFixed(2));
    }
  };

  const handleDimensionChange = (e) => {
    setEditValue(e.target.value);
  };

  const handleDimensionSubmit = (axis) => {
    const newValue = parseFloat(editValue);
    if (!isNaN(newValue) && newValue > 0 && originalDimensions) {
      const newScale = newValue / originalDimensions[axis];
      setScale(newScale);
    }
    setEditingDim(null);
  };

  const handleKeyDown = (e, axis) => {
    if (e.key === 'Enter') {
      handleDimensionSubmit(axis);
    } else if (e.key === 'Escape') {
      setEditingDim(null);
    }
  };

  const gridSize = useMemo(() => {
    if (geometry && geometry.boundingBox) {
      const box = geometry.boundingBox;
      const size = new THREE.Vector3();
      box.getSize(size);
      return Math.max(size.x, size.y, size.z) * 2.5;
    }
    return 200;
  }, [geometry]);

  if (!geometry) {
    return (
      <div className="viewer-placeholder">
        <p>Aucun modèle chargé</p>
      </div>
    );
  }

  return (
    <div className="stl-viewer">
      <div className="viewer-toolbar">
        <button
          className="toolbar-btn home-btn"
          onClick={handleHomeClick}
          title="Vue Home (H)"
        >
          <span>Home</span>
        </button>
        <div className="toolbar-separator" />
        <button
          className={`toolbar-btn ${transformMode === 'translate' ? 'active' : ''}`}
          onClick={() => setTransformMode('translate')}
          title="Déplacer (G)"
        >
          <span>Déplacer</span>
        </button>
        <button
          className={`toolbar-btn ${transformMode === 'rotate' ? 'active' : ''}`}
          onClick={() => setTransformMode('rotate')}
          title="Tourner (R)"
        >
          <span>Tourner</span>
        </button>
        <button
          className={`toolbar-btn ${transformMode === 'scale' ? 'active' : ''}`}
          onClick={() => setTransformMode('scale')}
          title="Redimensionner (S)"
        >
          <span>Échelle</span>
        </button>
      </div>

      <Canvas
        camera={{ position: [100, 100, 100], fov: 45 }}
        gl={{ antialias: true }}
      >
        {/* Fond dégradé */}
        <color attach="background" args={['#0f0f1a']} />

        {/* Environnement pour les reflets */}
        <Environment preset="city" />

        {/* Éclairage principal */}
        <ambientLight intensity={0.3} />

        <directionalLight
          position={[50, 80, 50]}
          intensity={1.5}
        />

        <directionalLight
          position={[-30, 40, -30]}
          intensity={0.5}
          color="#b4c7ff"
        />

        <pointLight position={[0, 100, 0]} intensity={0.3} color="#fff5e6" />

        {/* Rim light */}
        <spotLight
          position={[-50, 50, -50]}
          angle={0.5}
          penumbra={1}
          intensity={0.5}
          color="#4a6bff"
        />

        <Model
          geometry={geometry}
          transformMode={transformMode}
          scale={scale}
          onScaleChange={handleScaleChange}
        />

        <CameraController
          geometry={geometry}
          orbitControlsRef={orbitControlsRef}
          triggerHome={triggerHome}
        />

        <BuildPlate size={gridSize} />

        <OrbitControls
          ref={orbitControlsRef}
          makeDefault
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={gridSize * 5}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
          }}
        />
      </Canvas>

      {currentDimensions && (
        <div className="dimensions-panel">
          <div className="dimensions-header">
            <h4>Dimensions</h4>
            <button className="reset-scale-btn" onClick={resetScale} title="Réinitialiser l'échelle">
              Reset
            </button>
          </div>

          {['x', 'y', 'z'].map((axis) => (
            <div className="dim-row" key={axis}>
              <span
                className="dim-label"
                style={{ color: axis === 'x' ? '#ff6b6b' : axis === 'y' ? '#69db7c' : '#74c0fc' }}
              >
                {axis.toUpperCase()}
              </span>
              {editingDim === axis ? (
                <input
                  type="number"
                  className="dim-input"
                  value={editValue}
                  onChange={handleDimensionChange}
                  onBlur={() => handleDimensionSubmit(axis)}
                  onKeyDown={(e) => handleKeyDown(e, axis)}
                  autoFocus
                />
              ) : (
                <span
                  className="dim-value editable"
                  onClick={() => handleDimensionEdit(axis)}
                >
                  {currentDimensions[axis].toFixed(2)} mm
                </span>
              )}
            </div>
          ))}

          <div className="dim-row scale-row">
            <span className="dim-label">Échelle</span>
            <span className="dim-value">{(scale * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default STLViewer;
