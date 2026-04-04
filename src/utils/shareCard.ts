/**
 * Share Card Generator — renders profile/pattern cards as images using html2canvas
 */
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

export async function captureCardAsImage(elementId: string): Promise<Blob | null> {
  const el = document.getElementById(elementId);
  if (!el) return null;

  try {
    const canvas = await html2canvas(el, {
      backgroundColor: null,
      scale: 2, // Retina quality
      useCORS: true,
      logging: false,
    });
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
    });
  } catch (err) {
    console.error('Card capture error:', err);
    return null;
  }
}

export async function shareCardAsImage(elementId: string, title: string, text: string): Promise<void> {
  const blob = await captureCardAsImage(elementId);
  if (!blob) {
    toast.error('Failed to generate card');
    return;
  }

  const file = new File([blob], 'directly-card.png', { type: 'image/png' });

  // Use Web Share API with file if supported
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ title, text, files: [file] });
      return;
    } catch (e: any) {
      if (e.name === 'AbortError') return; // User cancelled
    }
  }

  // Fallback: download image
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'directly-card.png';
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Card saved!');
}
