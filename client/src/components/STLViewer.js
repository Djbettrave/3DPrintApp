import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Environment } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import * as THREE from 'three';
import { mm3ToCm3 } from '../utils/stlUtils';

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

function CameraController({ geometry, orbitControlsRef, triggerHome, zoomAction }) {
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

  // Gérer le zoom via boutons
  useEffect(() => {
    if (zoomAction && orbitControlsRef.current) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      const zoomFactor = zoomAction === 'in' ? -30 : 30;
      camera.position.addScaledVector(direction, zoomFactor);
      camera.updateProjectionMatrix();
    }
  }, [zoomAction, camera, orbitControlsRef]);

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

function STLViewer({ fileData, onModelLoad, onScaleApply }) {
  const [geometry, setGeometry] = useState(null);
  const [transformMode, setTransformMode] = useState('translate');
  const [originalDimensions, setOriginalDimensions] = useState(null);
  const [originalVolume, setOriginalVolume] = useState(0);
  const [scale, setScale] = useState(1);
  const [appliedScale, setAppliedScale] = useState(1);
  const [editingDim, setEditingDim] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [triggerHome, setTriggerHome] = useState(0);
  const [zoomAction, setZoomAction] = useState(null);
  const orbitControlsRef = useRef();
  const meshRef = useRef();
  const viewerRef = useRef();

  // Bloquer le scroll de la page quand la souris est sur le viewer
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleWheel = (e) => {
      e.preventDefault();
    };

    viewer.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      viewer.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleHomeClick = () => {
    setTriggerHome(prev => prev + 1);
  };

  const handleZoom = (direction) => {
    setZoomAction(direction);
    setTimeout(() => setZoomAction(null), 50);
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
      setAppliedScale(1);

      // Calculer le volume original
      const position = geom.attributes.position;
      let vol = 0;
      for (let i = 0; i < position.count; i += 3) {
        const v1 = { x: position.getX(i), y: position.getY(i), z: position.getZ(i) };
        const v2 = { x: position.getX(i + 1), y: position.getY(i + 1), z: position.getZ(i + 1) };
        const v3 = { x: position.getX(i + 2), y: position.getY(i + 2), z: position.getZ(i + 2) };
        vol += (v1.x * (v2.y * v3.z - v3.y * v2.z) - v2.x * (v1.y * v3.z - v3.y * v1.z) + v3.x * (v1.y * v2.z - v2.y * v1.z)) / 6.0;
      }
      setOriginalVolume(Math.abs(vol));

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

  const hasScaleChanged = scale !== appliedScale;

  const handleApplyScale = useCallback(() => {
    if (onScaleApply && originalDimensions && originalVolume) {
      const newDimensions = {
        x: originalDimensions.x * scale,
        y: originalDimensions.y * scale,
        z: originalDimensions.z * scale
      };
      // Volume scales by the cube of the scale factor
      const newVolumeMm3 = originalVolume * Math.pow(scale, 3);
      const newVolumeCm3 = mm3ToCm3(newVolumeMm3);

      onScaleApply(newDimensions, newVolumeCm3);
      setAppliedScale(scale);
    }
  }, [scale, originalDimensions, originalVolume, onScaleApply]);

  const handleExportSTL = useCallback(() => {
    if (!geometry) return;

    // Créer une copie de la géométrie avec l'échelle appliquée
    const scaledGeometry = geometry.clone();
    scaledGeometry.scale(scale, scale, scale);

    // Créer un mesh temporaire pour l'export
    const tempMesh = new THREE.Mesh(scaledGeometry);

    const exporter = new STLExporter();
    const stlString = exporter.parse(tempMesh);

    // Créer et télécharger le fichier
    const blob = new Blob([stlString], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'model_scaled.stl';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [geometry, scale]);

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
    <div className="stl-viewer" ref={viewerRef}>
      <div className="viewer-toolbar">
        <button
          className="toolbar-btn home-btn"
          onClick={handleHomeClick}
          title="Vue Home (H)"
        >
          <span>Home vue</span>
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
          zoomAction={zoomAction}
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
          enableDamping={true}
          dampingFactor={0.05}
          zoomSpeed={1.2}
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

          <div className="dimensions-actions">
            {hasScaleChanged && (
              <button className="apply-scale-btn" onClick={handleApplyScale}>
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Appliquer
              </button>
            )}
            <button className="export-stl-btn" onClick={handleExportSTL}>
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Exporter STL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default STLViewer;
