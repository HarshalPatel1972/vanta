import * as THREE from 'three';

export const captureCanvas = async (renderer: THREE.WebGLRenderer): Promise<string> => {
  // Ensure the frame is captured after rendering
  renderer.render(renderer.scene, renderer.camera);
  return renderer.domElement.toDataURL('image/png');
};

export const downloadImage = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
};

export const shareImage = async (blob: Blob, filename: string) => {
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: 'image/png' })] })) {
    try {
      await navigator.share({
        files: [new File([blob], filename, { type: 'image/png' })],
        title: 'Made with VANTA',
      });
      return true;
    } catch (err) {
      console.error('Share failed', err);
      return false;
    }
  }
  return false;
};
