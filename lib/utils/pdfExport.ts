import { jsPDF } from "jspdf";

export const exportToPDF = async (imageDataUrl: string, fileName: string) => {
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [1920, 1080]
  });

  pdf.addImage(imageDataUrl, "PNG", 0, 0, 1920, 1080);
  
  // Add some metadata
  pdf.setFontSize(24);
  pdf.setTextColor(122, 122, 154); // --fog
  pdf.text("VANTA SPATIAL CAPTURE", 40, 1040);
  pdf.text(new Date().toLocaleDateString(), 1800, 1040, { align: "right" });

  pdf.save(fileName);
};
