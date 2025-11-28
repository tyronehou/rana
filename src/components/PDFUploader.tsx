import { forwardRef, useImperativeHandle } from 'react'

interface PDFUploaderProps {
  onFileSelect: (file: File, handle: FileSystemFileHandle | null) => void
}

export interface PDFUploaderRef {
  openFilePicker: () => void
}

export const PDFUploader = forwardRef<PDFUploaderRef, PDFUploaderProps>(
  ({ onFileSelect }, ref) => {
    const handleClick = async () => {
      // Try File System Access API first (allows overwriting)
      if ('showOpenFilePicker' in window && window.showOpenFilePicker) {
        try {
          const [handle] = await window.showOpenFilePicker({
            types: [
              {
                description: 'PDF Files',
                accept: { 'application/pdf': ['.pdf'] },
              },
            ],
            multiple: false,
          })
          const file = await handle.getFile()
          onFileSelect(file, handle)
          return
        } catch (err) {
          // User cancelled or API not available, fall through to input
          if ((err as Error).name === 'AbortError') return
        }
      }

      // Fallback to regular file input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.pdf,application/pdf'
      input.onchange = () => {
        const file = input.files?.[0]
        if (file && file.type === 'application/pdf') {
          onFileSelect(file, null)
        }
      }
      input.click()
    }

    useImperativeHandle(ref, () => ({
      openFilePicker: handleClick,
    }))

    return (
      <div className="pdf-uploader">
        <button onClick={handleClick} className="upload-button">
          Open PDF
        </button>
      </div>
    )
  }
)
