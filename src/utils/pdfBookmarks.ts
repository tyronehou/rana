import { PDFDocument, PDFName, PDFDict, PDFString, PDFRef, PDFNumber } from 'pdf-lib'
import { Bookmark } from '../components/SidebarPanel'

/**
 * Adds bookmarks to a PDF and returns the modified PDF as bytes.
 */
export async function addBookmarksToPdf(
  file: File,
  bookmarks: Bookmark[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)
  const context = pdfDoc.context

  if (bookmarks.length === 0) {
    // Remove existing outlines when there are no bookmarks
    pdfDoc.catalog.delete(PDFName.of('Outlines'))
    return pdfDoc.save()
  }

  // Get page refs
  const pages = pdfDoc.getPages()

  // Flatten bookmarks to count total items
  function countItems(items: Bookmark[]): number {
    return items.reduce((count, item) => {
      return count + 1 + (item.children ? countItems(item.children) : 0)
    }, 0)
  }

  // Create outline entries recursively and return refs
  function createOutlineEntries(
    items: Bookmark[],
    parentRef: PDFRef
  ): { refs: PDFRef[]; dicts: PDFDict[] } {
    const refs: PDFRef[] = []
    const dicts: PDFDict[] = []

    for (const item of items) {
      const dict = context.obj({})
      const ref = context.register(dict)
      refs.push(ref)
      dicts.push(dict)

      // Set title
      dict.set(PDFName.of('Title'), PDFString.of(item.label))

      // Set parent
      dict.set(PDFName.of('Parent'), parentRef)

      // Set destination (page)
      const pageIndex = Math.min(Math.max(item.page - 1, 0), pages.length - 1)
      const pageRef = pages[pageIndex].ref
      const destArray = context.obj([pageRef, PDFName.of('Fit')])
      dict.set(PDFName.of('Dest'), destArray)

      // Handle children
      if (item.children && item.children.length > 0) {
        const childResult = createOutlineEntries(item.children, ref)
        if (childResult.refs.length > 0) {
          dict.set(PDFName.of('First'), childResult.refs[0])
          dict.set(PDFName.of('Last'), childResult.refs[childResult.refs.length - 1])
          const childCount = countItems(item.children)
          dict.set(
            PDFName.of('Count'),
            PDFNumber.of(item.expanded !== false ? childCount : -childCount)
          )

          // Link children siblings
          for (let i = 0; i < childResult.refs.length; i++) {
            if (i > 0) {
              childResult.dicts[i].set(PDFName.of('Prev'), childResult.refs[i - 1])
            }
            if (i < childResult.refs.length - 1) {
              childResult.dicts[i].set(PDFName.of('Next'), childResult.refs[i + 1])
            }
          }
        }
      }
    }

    return { refs, dicts }
  }

  // Create outline root
  const outlinesDict = context.obj({})
  const outlinesRef = context.register(outlinesDict)
  outlinesDict.set(PDFName.of('Type'), PDFName.of('Outlines'))

  // Create outline entries
  const result = createOutlineEntries(bookmarks, outlinesRef)

  if (result.refs.length > 0) {
    outlinesDict.set(PDFName.of('First'), result.refs[0])
    outlinesDict.set(PDFName.of('Last'), result.refs[result.refs.length - 1])
    outlinesDict.set(PDFName.of('Count'), PDFNumber.of(countItems(bookmarks)))

    // Link root siblings
    for (let i = 0; i < result.refs.length; i++) {
      if (i > 0) {
        result.dicts[i].set(PDFName.of('Prev'), result.refs[i - 1])
      }
      if (i < result.refs.length - 1) {
        result.dicts[i].set(PDFName.of('Next'), result.refs[i + 1])
      }
    }
  }

  // Set outlines in catalog
  pdfDoc.catalog.set(PDFName.of('Outlines'), outlinesRef)

  return pdfDoc.save()
}

/**
 * Downloads the PDF with the given bytes.
 */
export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
