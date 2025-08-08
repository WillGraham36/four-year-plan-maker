'use client'

import { parsePdfFile } from '@/lib/api/forms/parse-transcript'
import { useState } from 'react'

export default function TranscriptInput() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parseTime, setParseTime] = useState<number | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult('')
    setParseTime(null)
    
    const startTime = performance.now()
    
    const formData = new FormData(e.currentTarget)
    const response = await parsePdfFile(formData)
    
    const endTime = performance.now()
    const timeTaken = endTime - startTime
    setParseTime(timeTaken)
    console.log(response.parsed);
    
    if (response.error) {
      setError(response.error)
    } else {
      setResult(response.text || "No text extracted")
    }
    
    setLoading(false)
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          name="file"
          title="put file pdf here" 
          accept=".pdf"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Upload PDF'}
        </button>
      </form>
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {error}
          {parseTime && (
            <div style={{ fontSize: '0.9em', marginTop: '5px' }}>
              Time taken: {(parseTime / 1000).toFixed(2)}s
            </div>
          )}
        </div>
      )}
      
      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Extracted Text:</h3>
          {parseTime && (
            <div style={{ 
              fontSize: '0.9em', 
              color: '#666', 
              marginBottom: '10px' 
            }}>
              ✅ Parsing completed in {(parseTime / 1000).toFixed(2)} seconds
            </div>
          )}
          <div style={{ 
            whiteSpace: 'pre-wrap', 
            border: '1px solid #ccc', 
            padding: '10px',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            {result}
          </div>
        </div>
      )}
    </div>
  )
}