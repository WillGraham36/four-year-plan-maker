// Helper function to inspect PDF form fields
export const inspectPDFFields = async () => {
  try {
    const { PDFDocument } = await import('pdf-lib');
    
    const existingPdfBytes = await fetch('/cmsc-graduation-plan-template.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const form = pdfDoc.getForm();
    
    const fields = form.getFields();
    console.log('Available PDF form fields:');
    
    fields.forEach((field, index) => {
      const name = field.getName();
      const type = field.constructor.name;
      console.log(`${index + 1}. Name: "${name}", Type: ${type}`);
    });
    
    return fields.map(field => ({
      name: field.getName(),
      type: field.constructor.name
    }));
    
  } catch (error) {
    console.error('Error inspecting PDF:', error);
    return [];
  }
};