'use client';
import React, { useState } from 'react'
import { SemesterSchema } from '@/lib/utils/schemas'
import { SemesterDateDescriptor } from '@/lib/utils/types'
import { toast } from 'sonner'

interface DownloadPDFButtonProps {
  semesters: SemesterSchema;
  academicYears: { year: number; semesters: SemesterDateDescriptor[] }[];
}

const DownloadPDFButton = ({ semesters, academicYears }: DownloadPDFButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      // Dynamic imports to handle client-side only components
      const { pdf } = await import('@react-pdf/renderer');
      const { default: AcademicTranscriptPDF } = await import('./download-as-pdf');
      
      // Generate PDF only when clicked
      const blob = await pdf(<AcademicTranscriptPDF semesters={semesters} academicYears={academicYears} />).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'academic-transcript.pdf';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={isGenerating}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {isGenerating ? 'Generating PDF...' : 'Download Academic Transcript'}
    </button>
  )
}

export default DownloadPDFButton