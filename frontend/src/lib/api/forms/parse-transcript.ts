'use server'

import { ALL_GEN_EDS, ALL_MAJORS, GenEd, Term } from '@/lib/utils/types'
import { PdfReader } from 'pdfreader'

export async function parseTranscript(file: File) {
  try {
    if(!file) {
      return { error: 'No file provided' }
    }
    
    if(file.type !== 'application/pdf') {
      return { error: 'File must be a PDF' }
    }

    if(file.size > 10 * 1024 * 1024) { // 10 MB limit
      return { error: 'File size exceeds 10 MB limit' }
    }

    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Parse PDF and extract text
    const text = await extractTextFromPdf(buffer)

    // Check for key identifying phrases
    const requiredPhrases = [
      "UNIVERSITY OF MARYLAND",
      "COLLEGE PARK", 
      "Office of the Registrar",
      "UNOFFICIAL TRANSCRIPT",
      "FOR ADVISING PURPOSES ONLY",
    ];

    const isValidTranscript = requiredPhrases.every(phrase => 
      text.includes(phrase)
    );

    if (!isValidTranscript) {
      return { error: 'Invalid transcript format' }
    }

    const parsed = getValuesFromText(text)

    
    return { 
      success: true, 
      text,
      filename: file.name,
      parsed
    }
    
  } catch (error) {
    return { 
      error: 'Failed to parse PDF file',
      details: error instanceof Error ? error.message : String(error)
    }
  }
}

function extractTextFromPdf(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const textItems: string[] = []
    
    new PdfReader().parseBuffer(buffer, (err, item) => {
      if (err) {
        reject(err)
        return
      }
      
      // End of file - resolve with all collected text
      if (!item) {
        resolve(textItems.join(' '))
        return
      }
      
      // Collect text items
      if (item.text) {
        textItems.push(item.text)
      }
    })
  })
}

export type ExtractedTextValues = {
  major: string | null;
  startTerm: Term | null;
  startYear: number | null;
  endTerm: Term | null;
  endYear: number | null;
  transferCredits: {
    name: string;
    courseId: string;
    genEds: string;
  }[];
  completedCourses: {
    term: string;
    year: number;
    courseId: string;
  }[];
}

function getValuesFromText(text: string): ExtractedTextValues {
  // Extract major using the provided list (unchanged)
  let major: string | null = null;
  const majorSection = text.match(/Major:\s*([^\n\r]+)/);
  if (majorSection) {
    const majorText = majorSection[1].trim();
    major = ALL_MAJORS.find(m => majorText.toLowerCase().includes(m.toLowerCase())) || null;
  }

  // Extract transfer credits
  const transferCredits: { name: string; courseId: string; genEds: string; }[] = [];

  // Look for transfer credit section - only get the section before Historic Course Information
  const transferSection = text.match(/\*\* Transfer Credit Information \*\*([\s\S]*?)(?=(Fall|Spring|Summer)\s+\d{4})/);

  if (transferSection) {
    const transferText = transferSection[1];
    
    // Normalize whitespace and remove newlines within course entries
    const normalizedTransferText = transferText.replace(/\s{2,}/g, ' ').replace(/\n/g, ' ');
    
    // Improved regex to capture course entries with GenEds
    const courseEntryRegex = /([A-Z][A-Z\s\/\d]+\/SCR\s+\d+|[A-Z\s]+)\s+(P|A|B|C|D|F|NC)[+-]?\s+[\d.]+\s+([A-Z]{4}\d{3})(?:\s+([A-Z]+(?:,\s*[A-Z]+)*(?:\s+or\s+[A-Z]+)*))?(?=\s|$)/g;

    let courseMatch;
    while ((courseMatch = courseEntryRegex.exec(normalizedTransferText)) !== null) {
      const [, courseNameWithScore, grade, courseId, rawGenEds] = courseMatch;
      
      // Skip if No Credit
      if (grade === 'NC' || /No Credit/i.test(grade)) continue;

      // Process course name
      let courseName = courseNameWithScore.trim();
      const apMatch = courseName.match(/\/SCR\s+[1-5]$/);
      if (apMatch) {
        courseName = 'AP ' + courseName.replace(/\/SCR\s+[1-5]$/, '').trim();
      }

      // Process GenEds
      let genEds = '';
      if (rawGenEds) {
        // Split and validate GenEds
        const genEdTokens = rawGenEds.split(/\s*,\s*|\s+or\s+/);
        const validGenEds = genEdTokens.filter(token => 
          ALL_GEN_EDS.includes(token as GenEd)
        );
        
        // Reconstruct with proper separators
        if (validGenEds.length > 0) {
          if (rawGenEds.includes(' or ')) {
            genEds = validGenEds.join(' or ');
          } else if (rawGenEds.includes(',')) {
            genEds = validGenEds.join(', ');
          } else {
            genEds = validGenEds.join(' ');
          }
        }
      }

      if (courseName && courseId) {
        transferCredits.push({
          name: courseName,
          courseId,
          genEds
        });
      }
    }
  }

  // Rest of the function remains unchanged
  const completedCourses: { term: string; year: number; courseId: string; }[] = [];
  
  // Find all semester sections (replace gs flags with g and [\s\S])
  const semesterRegex = /(Fall|Spring|Summer)\s+(\d{4})\s+([\s\S]*?)(?=(?:Fall|Spring|Summer)\s+\d{4}|\*\* Current Course Information \*\*|$)/g;
  let semesterMatch;
  
  let earliestYear: number | null = null;
  
  while ((semesterMatch = semesterRegex.exec(text)) !== null) {
    const term = semesterMatch[1];
    const year = parseInt(semesterMatch[2]);
    const courseSection = semesterMatch[3];
    
    // Track the earliest year
    if (earliestYear === null || year < earliestYear) {
      earliestYear = year;
    }
    
    // Extract courses from this semester - format: CMSC### COURSE NAME GRADE
    const courseMatches = [...courseSection.matchAll(/([A-Z]{4}\d{3})\s+[A-Z\s&-]+\s+[A-F][+-]?\s+[\d.]+\s+[\d.]+\s+[\d.]+/g)];
    for (const courseMatch of courseMatches) {
      completedCourses.push({
        term: term,
        year: year,
        courseId: courseMatch[1]
      });
    }
  }

  // Set start and end terms/years
  const startTerm = "FALL";
  const startYear = earliestYear;
  const endTerm = "SPRING";
  const endYear = earliestYear ? earliestYear + 4 : null;

  return {
    major,
    startTerm: startTerm,
    startYear: startYear,
    endTerm: endTerm,
    endYear: endYear,
    transferCredits,
    completedCourses
  };
}