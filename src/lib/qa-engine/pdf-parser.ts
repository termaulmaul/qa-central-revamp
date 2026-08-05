export const PDFParser = {
  extractText: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const loadWorker = () => {
        const pdfjs = (window as any).pdfjsLib
        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        processFile(pdfjs)
      }

      if ((window as any).pdfjsLib) {
        loadWorker()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = loadWorker
      script.onerror = () => reject(new Error('Gagal memuat pdf.js dari CDN'))
      document.head.appendChild(script)

      async function processFile(pdfjs: any) {
        try {
          const arrayBuffer = await file.arrayBuffer()
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
          let fullText = ''

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()

            // Advance Layout Analysis: Sort by Y (top to bottom), then X (left to right)
            const items = textContent.items.sort((a: any, b: any) => {
              const yDiff = b.transform[5] - a.transform[5]
              if (Math.abs(yDiff) > 5) return yDiff
              return a.transform[4] - b.transform[4]
            })

            let pageText = ''
            let lastY = -1,
              lastX = -1,
              lastStr = ''

            for (const item of items) {
              const cx = item.transform[4]
              const cy = item.transform[5]

              if (lastY !== -1 && Math.abs(lastY - cy) > 5) {
                pageText += '\n'
                lastX = -1
              }

              if (lastX !== -1) {
                if (
                  (item.str.length === 1 &&
                    lastStr &&
                    lastStr.length === 1 &&
                    cx - lastX < 4) ||
                  cx - lastX < 2
                ) {
                  pageText += item.str
                } else {
                  pageText +=
                    (pageText.endsWith(' ') || item.str.startsWith(' ') ? '' : ' ') + item.str
                }
              } else {
                pageText += item.str
              }

              lastY = cy
              lastX = cx + (item.width || 0)
              lastStr = item.str
            }

            // Post-process dict recovery
            pageText = pageText
              .replace(/Pro\s+j\s+ect|Pro j ect/gi, 'Project')
              .replace(/Techn\s+i\s+cal|Techn i cal/gi, 'Technical')
              .replace(/Fi\s+nanc\s+i\s+ng|Fi nanc i ng/gi, 'Financing')
              .replace(/Compl\s+i\s+ance|Compl i ance/gi, 'Compliance')
              .replace(/Ri\s+sk|Ri sk/gi, 'Risk')
              .replace(/Back\s+test|Back test/gi, 'Backtest')
              .replace(/Screen\s+i\s+ng|Screen i ng/gi, 'Screening')
              .replace(/Act\s+i\s+on|Act i on/gi, 'Action')
              .replace(/Locat\s+i\s+on|Locat i on/gi, 'Location')

            fullText += pageText + '\n\n'
          }
          resolve(fullText)
        } catch (e) {
          reject(new Error(`PDF parsing gagal: ${(e as any).message}`))
        }
      }
    })
  },
}
