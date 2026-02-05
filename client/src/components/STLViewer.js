import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Environment } from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';
import * as THREE from 'three';
import { mm3ToCm3 } from '../utils/stlUtils';

// === FLAG SÉCURITÉ : mettre à false pour revenir à l'ancien comportement ===
const ENABLE_AUTO_FIT = true;

function Model({
  geometry,
  transformMode,
  scale,
  onPoseChange,
  initialPose,
  resetPoseTrigger
}) {
  const meshRef = useRef();
  const transformRef = useRef();

  // Appliquer le scale (x, y, z indépendants)
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.set(scale.x, scale.z, scale.y);
    }
  }, [scale]);

  // Reset pose quand déclenché
  useEffect(() => {
    if (meshRef.current && initialPose && resetPoseTrigger > 0) {
      meshRef.current.position.copy(initialPose.position);
      meshRef.current.rotation.copy(initialPose.rotation);
    }
  }, [resetPoseTrigger, initialPose]);

  // Écouter les changements de pose (position/rotation uniquement)
  useEffect(() => {
    if (transformRef.current) {
      const controls = transformRef.current;
      const callback = () => {
        if (meshRef.current && onPoseChange) {
          onPoseChange({
            position: meshRef.current.position.clone(),
            rotation: meshRef.current.rotation.clone()
          });
        }
      };
      controls.addEventListener('change', callback);
      return () => controls.removeEventListener('change', callback);
    }
  }, [onPoseChange]);

  return (
    <>
      <mesh ref={meshRef} geometry={geometry} scale={[scale.x, scale.z, scale.y]}>
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

function CameraController({ geometry, orbitControlsRef, triggerHome, zoomAction, scale, cameraRefitTrigger }) {
  const { camera } = useThree();

  // Auto-fit caméra avec near/far dynamiques
  // === BUG 3 FIX : déclenché par triggerHome, cameraRefitTrigger, ou changement de geometry ===
  useEffect(() => {
    const goToHomeView = () => {
      if (!geometry || !geometry.boundingBox || !orbitControlsRef.current) return;

      const box = geometry.boundingBox.clone();
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // Prendre en compte l'échelle actuelle (moyenne des 3 axes)
      const avgScale = (scale.x + scale.y + scale.z) / 3;
      const scaledSize = size.clone().multiplyScalar(avgScale);
      const maxDim = Math.max(scaledSize.x, scaledSize.y, scaledSize.z);

      // Protection contre les modèles trop petits ou mal définis
      const safeMaxDim = Math.max(maxDim, 1);

      // Distance basée sur le FOV pour bien cadrer le modèle
      const fov = camera.fov * (Math.PI / 180);
      const distance = (safeMaxDim / 2) / Math.tan(fov / 2) * 2.0;

      // Position caméra: vue 3/4 isométrique
      camera.position.set(
        center.x + distance * 0.7,
        center.y + distance * 0.5,
        center.z + distance * 0.7
      );

      // === AUTO-FIT : near/far dynamiques basés sur la taille du modèle ===
      if (ENABLE_AUTO_FIT) {
        // Near: assez proche pour les petits modèles, mais pas trop pour éviter le clipping
        const nearClip = Math.max(0.1, safeMaxDim * 0.001);
        // Far: assez loin pour les grands modèles (10x la distance de vue)
        const farClip = Math.max(distance * 10, safeMaxDim * 20);

        camera.near = nearClip;
        camera.far = farClip;

        // Mettre à jour les limites de distance des contrôles
        orbitControlsRef.current.minDistance = safeMaxDim * 0.1;
        orbitControlsRef.current.maxDistance = distance * 5;
      }

      // Cibler le centre du modèle
      orbitControlsRef.current.target.set(center.x, center.y, center.z);
      orbitControlsRef.current.update();

      camera.updateProjectionMatrix();
    };

    goToHomeView();
  }, [geometry, camera, orbitControlsRef, triggerHome, scale, cameraRefitTrigger]);

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

function STLViewer({ fileData, fileName, onModelLoad, onScaleApply }) {
  const [geometry, setGeometry] = useState(null);
  const [transformMode, setTransformMode] = useState('translate');
  const [originalDimensions, setOriginalDimensions] = useState(null);
  const [originalVolume, setOriginalVolume] = useState(0);
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 });
  const [appliedScale, setAppliedScale] = useState({ x: 1, y: 1, z: 1 });
  const [proportionalLock, setProportionalLock] = useState(true);
  const [editingDim, setEditingDim] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [triggerHome, setTriggerHome] = useState(0);
  const [zoomAction, setZoomAction] = useState(null);
  // === BUG 1 FIX : flag fiable pour pose modifiée ===
  const [initialPose, setInitialPose] = useState(null);
  const [poseModified, setPoseModified] = useState(false);
  const [resetPoseTrigger, setResetPoseTrigger] = useState(0);
  // === BUG 3 FIX : trigger pour refit caméra après changement de scale ===
  const [cameraRefitTrigger, setCameraRefitTrigger] = useState(0);
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

  // === BUG 1 FIX : réinitialiser position et rotation ===
  const handleResetPose = () => {
    setResetPoseTrigger(prev => prev + 1);
    setPoseModified(false);
    // Déclencher aussi un refit caméra pour recentrer la vue
    setCameraRefitTrigger(prev => prev + 1);
  };

  // Callback pour les changements de pose (translate ou rotate)
  const handlePoseChange = useCallback(() => {
    // Marquer la pose comme modifiée dès qu'il y a un changement
    setPoseModified(true);
  }, []);

  useEffect(() => {
    if (!fileData) return;

    let geom;
    const isOBJ = fileName?.toLowerCase().endsWith('.obj');

    if (isOBJ) {
      // OBJ : parser le texte et extraire la géométrie du premier mesh
      const text = new TextDecoder().decode(fileData);
      const loader = new OBJLoader();
      const group = loader.parse(text);
      const mesh = group.children.find(child => child.isMesh);
      if (!mesh) {
        console.error('Aucun mesh trouvé dans le fichier OBJ');
        return;
      }
      geom = mesh.geometry.clone();
    } else {
      // STL : parser binaire
      const loader = new STLLoader();
      geom = loader.parse(fileData);
    }

    // Rotation pour aligner Z-up vers Y-up (Three.js)
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
      y: Math.abs(newBox.max.z - newBox.min.z),
      z: Math.abs(newBox.max.y - newBox.min.y)
    };
    setOriginalDimensions(dims);
    setScale({ x: 1, y: 1, z: 1 });
    setAppliedScale({ x: 1, y: 1, z: 1 });

    setInitialPose({
      position: new THREE.Vector3(0, 0, 0),
      rotation: new THREE.Euler(0, 0, 0)
    });
    setPoseModified(false);
    setResetPoseTrigger(0);
    setCameraRefitTrigger(0);

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
  }, [fileData, fileName, onModelLoad]);

  // === BUG 2 FIX : suppression auto-sync, le bouton "Appliquer" reste visible ===
  // L'utilisateur doit cliquer "Appliquer" pour valider les changements

  const resetScale = () => {
    setScale({ x: 1, y: 1, z: 1 });
    if (onScaleApply && originalDimensions && originalVolume) {
      onScaleApply(originalDimensions, mm3ToCm3(originalVolume));
      setAppliedScale({ x: 1, y: 1, z: 1 });
    }
    setCameraRefitTrigger(prev => prev + 1);
  };

  const hasScaleChanged = scale.x !== appliedScale.x || scale.y !== appliedScale.y || scale.z !== appliedScale.z;

  const handleApplyScale = useCallback(() => {
    if (onScaleApply && originalDimensions && originalVolume) {
      const newDimensions = {
        x: originalDimensions.x * scale.x,
        y: originalDimensions.y * scale.y,
        z: originalDimensions.z * scale.z
      };
      const volumeScale = scale.x * scale.y * scale.z;
      const newVolumeMm3 = originalVolume * volumeScale;
      const newVolumeCm3 = mm3ToCm3(newVolumeMm3);

      onScaleApply(newDimensions, newVolumeCm3);
      setAppliedScale({ ...scale });
      setCameraRefitTrigger(prev => prev + 1);
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
      x: originalDimensions.x * scale.x,
      y: originalDimensions.y * scale.y,
      z: originalDimensions.z * scale.z
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
      const newAxisScale = newValue / originalDimensions[axis];
      if (proportionalLock) {
        setScale({ x: newAxisScale, y: newAxisScale, z: newAxisScale });
      } else {
        setScale(prev => ({ ...prev, [axis]: newAxisScale }));
      }
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
        <div className="toolbar-separator" />
        <button
          className={`toolbar-btn reset-pose-btn ${poseModified ? 'has-changes' : ''}`}
          onClick={handleResetPose}
          title="Réinitialiser position et rotation"
          disabled={!poseModified}
        >
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M3 12L6 9M3 12L6 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Reset Pose</span>
        </button>
      </div>

      <Canvas
        camera={{ position: [100, 100, 100], fov: 45 }}
        gl={{ antialias: true }}
      >
        {/* Fond dégradé */}
        <color attach="background" args={['#1e293b']} />

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
          onPoseChange={handlePoseChange}
          initialPose={initialPose}
          resetPoseTrigger={resetPoseTrigger}
        />

        <CameraController
          geometry={geometry}
          orbitControlsRef={orbitControlsRef}
          triggerHome={triggerHome}
          zoomAction={zoomAction}
          scale={scale}
          cameraRefitTrigger={cameraRefitTrigger}
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
            <div className="dimensions-header-actions">
              <button
                className={`lock-btn ${proportionalLock ? 'locked' : ''}`}
                onClick={() => setProportionalLock(!proportionalLock)}
                title={proportionalLock ? 'Mode proportionnel (cliquez pour désactiver)' : 'Mode libre (cliquez pour activer proportionnel)'}
              >
                {proportionalLock ? (
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {['x', 'y', 'z'].map((axis) => (
            <div className="dim-row" key={axis}>
              <span
                className="dim-label"
                style={{
                  // Couleurs alignées avec les axes visuels Three.js après rotation:
                  // X = rouge (Three.js X), Y = bleu (Three.js Z = profondeur), Z = vert (Three.js Y = hauteur)
                  color: axis === 'x' ? '#ff6b6b' : axis === 'y' ? '#74c0fc' : '#69db7c'
                }}
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
            <span className="dim-value">
              {scale.x === scale.y && scale.y === scale.z
                ? `${(scale.x * 100).toFixed(0)}%`
                : `X:${(scale.x * 100).toFixed(0)}% Y:${(scale.y * 100).toFixed(0)}% Z:${(scale.z * 100).toFixed(0)}%`
              }
            </span>
          </div>
          <button className="reset-scale-btn" onClick={resetScale} title="Réinitialiser l'échelle">
            Reset
          </button>

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
