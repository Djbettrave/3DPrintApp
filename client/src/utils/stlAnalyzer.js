/**
 * STL Analyzer - Détection des fichiers multi-objets et des trous
 *
 * Détecte si un fichier STL contient plusieurs objets distincts
 * et détermine s'ils sont séparés ou assemblés.
 * Détecte également les trous (arêtes ouvertes) dans le mesh.
 */

// Flag de feature - mettre à false pour désactiver
const ENABLE_MULTI_OBJECT_DETECTION = process.env.REACT_APP_ENABLE_MULTI_OBJECT_DETECTION !== 'false';
const ENABLE_HOLE_DETECTION = process.env.REACT_APP_ENABLE_HOLE_DETECTION !== 'false';

// Seuil de séparation en mm (objets séparés de plus que ça = bloqués)
const SEPARATION_THRESHOLD = 1.0;

// Tolérance pour considérer deux vertices comme identiques
const VERTEX_TOLERANCE = 0.0001;

/**
 * Analyse une géométrie STL pour détecter les objets multiples
 * @param {THREE.BufferGeometry} geometry - Géométrie parsée par STLLoader
 * @returns {Object} Résultat de l'analyse
 */
export function analyzeSTLGeometry(geometry) {
  // Si la détection est désactivée, autoriser tout
  if (!ENABLE_MULTI_OBJECT_DETECTION) {
    return { status: 'single_object', components: 1, action: 'allow' };
  }

  try {
    const position = geometry.attributes.position;
    const triangleCount = position.count / 3;

    // Si très peu de triangles, c'est forcément un seul objet
    if (triangleCount < 4) {
      return { status: 'single_object', components: 1, action: 'allow' };
    }

    // 1. Extraire les triangles avec leurs vertices
    const triangles = extractTriangles(position);

    // 2. Construire la map d'adjacence (triangles connectés)
    const adjacencyMap = buildAdjacencyMap(triangles);

    // 3. Trouver les composants connectés
    const components = findConnectedComponents(triangles.length, adjacencyMap);

    // 4. Si un seul composant, c'est OK
    if (components.length === 1) {
      return { status: 'single_object', components: 1, action: 'allow' };
    }

    // 5. Calculer les bounding boxes de chaque composant
    const boundingBoxes = components.map(comp =>
      computeComponentBoundingBox(comp, triangles)
    );

    // 6. Calculer la distance minimale entre les composants
    const minDistance = calculateMinDistanceBetweenBoxes(boundingBoxes);

    // 7. Décision basée sur la distance
    if (minDistance > SEPARATION_THRESHOLD) {
      return {
        status: 'separated_objects',
        components: components.length,
        minDistance: minDistance.toFixed(2),
        action: 'block'
      };
    } else {
      return {
        status: 'assembled_objects',
        components: components.length,
        minDistance: minDistance.toFixed(2),
        action: 'warn'
      };
    }
  } catch (error) {
    console.error('Erreur lors de l\'analyse STL:', error);
    // En cas d'erreur, autoriser l'upload (fallback safe)
    return {
      status: 'analysis_error',
      components: 1,
      action: 'allow',
      error: error.message
    };
  }
}

/**
 * Extrait les triangles depuis les attributs de position
 */
function extractTriangles(position) {
  const triangles = [];

  for (let i = 0; i < position.count; i += 3) {
    triangles.push({
      vertices: [
        { x: position.getX(i), y: position.getY(i), z: position.getZ(i) },
        { x: position.getX(i + 1), y: position.getY(i + 1), z: position.getZ(i + 1) },
        { x: position.getX(i + 2), y: position.getY(i + 2), z: position.getZ(i + 2) }
      ]
    });
  }

  return triangles;
}

/**
 * Crée une clé unique pour un vertex (pour comparaison rapide)
 */
function vertexKey(v) {
  // Arrondir pour gérer les erreurs de précision flottante
  const precision = 1 / VERTEX_TOLERANCE;
  const x = Math.round(v.x * precision);
  const y = Math.round(v.y * precision);
  const z = Math.round(v.z * precision);
  return `${x},${y},${z}`;
}

/**
 * Construit une map d'adjacence des triangles
 * Deux triangles sont adjacents s'ils partagent au moins un vertex
 */
function buildAdjacencyMap(triangles) {
  // Map: vertexKey -> liste des indices de triangles
  const vertexToTriangles = new Map();

  // Enregistrer quels triangles utilisent chaque vertex
  triangles.forEach((tri, triIndex) => {
    tri.vertices.forEach(v => {
      const key = vertexKey(v);
      if (!vertexToTriangles.has(key)) {
        vertexToTriangles.set(key, []);
      }
      vertexToTriangles.get(key).push(triIndex);
    });
  });

  // Construire la map d'adjacence
  const adjacency = new Map();

  for (let i = 0; i < triangles.length; i++) {
    adjacency.set(i, new Set());
  }

  // Pour chaque vertex, tous les triangles qui le partagent sont adjacents
  vertexToTriangles.forEach(triIndices => {
    for (let i = 0; i < triIndices.length; i++) {
      for (let j = i + 1; j < triIndices.length; j++) {
        adjacency.get(triIndices[i]).add(triIndices[j]);
        adjacency.get(triIndices[j]).add(triIndices[i]);
      }
    }
  });

  return adjacency;
}

/**
 * Trouve les composants connectés via BFS
 */
function findConnectedComponents(triangleCount, adjacencyMap) {
  const visited = new Set();
  const components = [];

  for (let start = 0; start < triangleCount; start++) {
    if (visited.has(start)) continue;

    // BFS pour trouver tous les triangles connectés
    const component = [];
    const queue = [start];
    visited.add(start);

    while (queue.length > 0) {
      const current = queue.shift();
      component.push(current);

      const neighbors = adjacencyMap.get(current) || new Set();
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }

    components.push(component);
  }

  return components;
}

/**
 * Calcule la bounding box d'un composant
 */
function computeComponentBoundingBox(componentIndices, triangles) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  componentIndices.forEach(triIndex => {
    triangles[triIndex].vertices.forEach(v => {
      minX = Math.min(minX, v.x);
      minY = Math.min(minY, v.y);
      minZ = Math.min(minZ, v.z);
      maxX = Math.max(maxX, v.x);
      maxY = Math.max(maxY, v.y);
      maxZ = Math.max(maxZ, v.z);
    });
  });

  return { minX, minY, minZ, maxX, maxY, maxZ };
}

/**
 * Calcule la distance minimale entre les bounding boxes
 */
function calculateMinDistanceBetweenBoxes(boxes) {
  let minDistance = Infinity;

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const dist = boxToBoxDistance(boxes[i], boxes[j]);
      minDistance = Math.min(minDistance, dist);
    }
  }

  return minDistance;
}

/**
 * Calcule la distance entre deux bounding boxes
 * Retourne 0 si elles se chevauchent
 */
function boxToBoxDistance(box1, box2) {
  // Distance sur chaque axe (0 si chevauchement)
  const dx = Math.max(0, Math.max(box1.minX - box2.maxX, box2.minX - box1.maxX));
  const dy = Math.max(0, Math.max(box1.minY - box2.maxY, box2.minY - box1.maxY));
  const dz = Math.max(0, Math.max(box1.minZ - box2.maxZ, box2.minZ - box1.maxZ));

  // Distance euclidienne
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Crée une clé unique pour une arête (paire de vertices ordonnée)
 * L'ordre est normalisé pour que edge(A,B) === edge(B,A)
 */
function edgeKey(v1, v2) {
  const key1 = vertexKey(v1);
  const key2 = vertexKey(v2);
  // Ordonner pour avoir une clé unique quelle que soit la direction
  return key1 < key2 ? `${key1}|${key2}` : `${key2}|${key1}`;
}

/**
 * Détecte les trous dans le mesh (arêtes ouvertes)
 * Un mesh watertight = chaque arête est partagée par exactement 2 faces
 * @param {Array} triangles - Liste des triangles extraits
 * @returns {Object} { hasHoles, openEdgeCount, totalEdgeCount }
 */
function detectHoles(triangles) {
  // Map: edgeKey -> nombre de faces qui utilisent cette arête
  const edgeCount = new Map();

  // Parcourir chaque triangle et compter les arêtes
  triangles.forEach(tri => {
    const v = tri.vertices;

    // Un triangle a 3 arêtes: (v0,v1), (v1,v2), (v2,v0)
    const edges = [
      edgeKey(v[0], v[1]),
      edgeKey(v[1], v[2]),
      edgeKey(v[2], v[0])
    ];

    edges.forEach(edge => {
      edgeCount.set(edge, (edgeCount.get(edge) || 0) + 1);
    });
  });

  // Compter les arêtes ouvertes (utilisées par 1 seule face)
  let openEdgeCount = 0;
  edgeCount.forEach(count => {
    if (count === 1) {
      openEdgeCount++;
    }
  });

  return {
    hasHoles: openEdgeCount > 0,
    openEdgeCount,
    totalEdgeCount: edgeCount.size
  };
}

/**
 * Analyse complète d'une géométrie STL
 * Exporte une fonction qui combine détection multi-objets et trous
 */
export function analyzeSTLComplete(geometry) {
  const baseAnalysis = analyzeSTLGeometry(geometry);

  // Si la détection de trous est désactivée, retourner l'analyse de base
  if (!ENABLE_HOLE_DETECTION) {
    return { ...baseAnalysis, holes: null };
  }

  try {
    const position = geometry.attributes.position;
    const triangles = extractTriangles(position);
    const holeAnalysis = detectHoles(triangles);

    // Déterminer l'action finale en combinant les deux analyses
    let finalAction = baseAnalysis.action;

    // Si des trous sont détectés et que l'action n'est pas déjà 'block'
    if (holeAnalysis.hasHoles && finalAction !== 'block') {
      finalAction = 'warn';
    }

    return {
      ...baseAnalysis,
      action: finalAction,
      holes: holeAnalysis
    };
  } catch (error) {
    console.error('Erreur lors de la détection des trous:', error);
    return { ...baseAnalysis, holes: null };
  }
}

export default analyzeSTLGeometry;
