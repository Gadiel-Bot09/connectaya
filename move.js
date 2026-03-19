const fs = require('fs')
const path = require('path')

const appDir = path.join(__dirname, 'src', 'app')
const dashboardDir = path.join(appDir, '(dashboard)')

if (!fs.existsSync(dashboardDir)) {
  fs.mkdirSync(dashboardDir, { recursive: true })
}

const itemsToMove = ['campaigns', 'contacts', 'maps', 'settings', 'page.tsx']
itemsToMove.forEach(item => {
  const from = path.join(appDir, item)
  const to = path.join(dashboardDir, item)
  if (fs.existsSync(from)) {
    fs.renameSync(from, to)
    console.log(`Moved ${item}`)
  }
})
