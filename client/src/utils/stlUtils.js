/**
 * Calcule le volume d'une géométrie en mm³
 * Utilise la formule du volume signé pour les triangles
 */
export function calculateVolume(geometry) {
  const position = geometry.attributes.position;
  let volume = 0;

  for (let i = 0; i < position.count; i += 3) {
    const v1 = {
      x: position.getX(i),
      y: position.getY(i),
      z: position.getZ(i)
    };
    const v2 = {
      x: position.getX(i + 1),
      y: position.getY(i + 1),
      z: position.getZ(i + 1)
    };
    const v3 = {
      x: position.getX(i + 2),
      y: position.getY(i + 2),
      z: position.getZ(i + 2)
    };

    // Volume signé du tétraèdre formé avec l'origine
    volume += signedVolumeOfTriangle(v1, v2, v3);
  }

  return Math.abs(volume);
}

function signedVolumeOfTriangle(v1, v2, v3) {
  return (
    (v1.x * (v2.y * v3.z - v3.y * v2.z) -
     v2.x * (v1.y * v3.z - v3.y * v1.z) +
     v3.x * (v1.y * v2.z - v2.y * v1.z)) / 6.0
  );
}

/**
 * Calcule les dimensions de la bounding box en mm
 */
export function calculateDimensions(geometry) {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;

  return {
    x: Math.abs(box.max.x - box.min.x),
    y: Math.abs(box.max.y - box.min.y),
    z: Math.abs(box.max.z - box.min.z)
  };
}

/**
 * Convertit mm³ en cm³
 */
export function mm3ToCm3(volumeMm3) {
  return volumeMm3 / 1000;
}
