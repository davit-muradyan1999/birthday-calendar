import { MONTHS, formatDay } from './months'

const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const FONT = "'Noto Sans Armenian','Segoe UI',Arial,sans-serif"

function headerHtml(count) {
  return `
    <h1 style="font-size:24px;margin:0 0 4px;">🎂 Ծննդյան օրերի ցուցակ</h1>
    <p style="margin:0;color:#64748b;font-size:13px;">
      Ընդհանուր՝ ${count} մարդ · Ստեղծված՝ ${formatDay(new Date().getMonth() + 1, new Date().getDate())} ${new Date().getFullYear()}թ.
    </p>`
}

function monthHtml(name, people) {
  const rows = people
    .map(
      (p, i) => `
      <tr style="background:${i % 2 ? '#f8fafc' : '#ffffff'};">
        <td style="width:70px;padding:7px 12px;border:1px solid #e2e8f0;font-weight:700;color:#4f46e5;text-align:center;">${p.day}</td>
        <td style="padding:7px 12px;border:1px solid #e2e8f0;">${escape(p.firstName)} ${escape(p.lastName)}</td>
      </tr>`,
    )
    .join('')
  return `
    <div style="background:#4f46e5;color:#ffffff;padding:7px 12px;border-radius:6px 6px 0 0;font-weight:700;font-size:15px;">
      ${name} <span style="font-weight:400;color:#c7d2fe;">(${people.length})</span>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>`
}

// PDF-ը ստեղծվում է HTML-ից նկարի տեսքով, որպեսզի հայերեն տառերը ճիշտ երևան։
// Ամեն ամիս առանձին բլոկ է, որպեսզի աղյուսակը էջերի միջև չկտրվի։
export async function exportPdf(birthdays) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')])

  const blocks = [headerHtml(birthdays.length)]
  MONTHS.forEach((name, i) => {
    const people = birthdays
      .filter((b) => b.month === i + 1)
      .sort((a, b) => a.day - b.day || a.lastName.localeCompare(b.lastName, 'hy'))
    if (people.length) blocks.push(monthHtml(name, people))
  })

  const container = document.createElement('div')
  container.style.cssText = `position:fixed;left:-10000px;top:0;width:720px;font-family:${FONT};color:#0f172a;background:#fff;`
  container.innerHTML = blocks.map((b) => `<div style="padding:0 0 16px;background:#fff;">${b}</div>`).join('')
  document.body.appendChild(container)

  try {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    const margin = 12
    const pageW = pdf.internal.pageSize.getWidth() - margin * 2
    const pageH = pdf.internal.pageSize.getHeight() - margin * 2
    let y = margin

    for (const el of container.children) {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' })
      let h = (canvas.height * pageW) / canvas.width
      let w = pageW
      if (h > pageH) {
        // Շատ երկար ամիսը փոքրացնում ենք, որ տեղավորվի մեկ էջում
        w = (pageW * pageH) / h
        h = pageH
      }
      if (y + h > margin + pageH) {
        pdf.addPage()
        y = margin
      }
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, y, w, h)
      y += h
    }

    pdf.save('cnndyan-orer.pdf')
  } finally {
    container.remove()
  }
}
