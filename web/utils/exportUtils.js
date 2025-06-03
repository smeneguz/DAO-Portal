// Basic utility functions for exporting visualizations

export const exportToPNG = (ref, filename, scale = 2) => {
  if (!ref || !ref.current) {
    console.error('No valid reference for export');
    return;
  }
  
  // This is a simplified implementation
  // In a real app, you would use html2canvas or a similar library
  const svgElement = ref.current.querySelector('svg');
  
  if (!svgElement) {
    console.error('No SVG element found');
    return;
  }
  
  console.log(`Exporting ${filename} as PNG at scale ${scale}`);
  
  // Simple alert for now - in a real app, this would trigger the actual download
  alert(`Exporting ${filename}.png (Scale: ${scale}x)`);
};

export const exportToSVG = (ref, filename) => {
  if (!ref || !ref.current) {
    console.error('No valid reference for export');
    return;
  }
  
  // This is a simplified implementation
  // In a real app, you would create a downloadable SVG file
  const svgElement = ref.current.querySelector('svg');
  
  if (!svgElement) {
    console.error('No SVG element found');
    return;
  }
  
  console.log(`Exporting ${filename} as SVG`);
  
  // Simple alert for now - in a real app, this would trigger the actual download
  alert(`Exporting ${filename}.svg`);
};