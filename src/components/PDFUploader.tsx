import { useRef, ChangeEvent } from 'react'

interface PDFUploaderProps {
  onFileSelect: (file: File) => void
}

export function PDFUploader({ onFileSelect }: PDFUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      onFileSelect(file)
    }
  }

  return (
    <div className="pdf-uploader">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
      />
      <button onClick={handleClick} className="upload-button">
        Upload PDF
      </button>
    </div>
  )
}
