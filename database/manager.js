const fs = require('fs')
const path = require('path')

class DatabaseManager {
  constructor() {
    this.baseDir = path.join(__dirname, 'usuarios')
    this.defaultData = {
      nombre: '',
      edad: 0,
      kryons: 100,
      diamantes: 0,
      banco: 0,
      exp: 0,
      nivel: 1,
      registrado: false,
      registroFecha: null,
      ultimoDaily: null,
      ultimoMinar: 0,
      ultimoMinar2: 0,
      ultimoWork: 0
    }
    
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true })
    }
  }

  getUserPath(userId) {
    const cleanId = userId.replace(/[^0-9]/g, '')
    return path.join(this.baseDir, `${cleanId}.json`)
  }

  getUserData(userId) {
    try {
      const userPath = this.getUserPath(userId)
      if (!fs.existsSync(userPath)) return null
      
      const data = JSON.parse(fs.readFileSync(userPath, 'utf8'))
      return data
    } catch (e) {
      console.error('Error cargando usuario:', e)
      return null
    }
  }

  saveUserData(userId, data) {
    try {
      const userPath = this.getUserPath(userId)
      fs.writeFileSync(userPath, JSON.stringify(data, null, 2))
      return true
    } catch (e) {
      console.error('Error guardando usuario:', e)
      return false
    }
  }

  registerUser(userId, nombre, edad) {
    const userData = {
      ...this.defaultData,
      nombre,
      edad,
      registrado: true,
      registroFecha: new Date().toISOString()
    }
    return this.saveUserData(userId, userData)
  }

  userExists(userId) {
    return fs.existsSync(this.getUserPath(userId))
  }

  updateUserField(userId, field, value) {
    const userData = this.getUserData(userId)
    if (!userData) return false
    
    userData[field] = value
    return this.saveUserData(userId, userData)
  }

  incrementUserField(userId, field, amount) {
    const userData = this.getUserData(userId)
    if (!userData) return false
    
    userData[field] = (userData[field] || 0) + amount
    
    // Calcular nivel basado en exp
    if (field === 'exp') {
      userData.nivel = Math.floor(userData.exp / 100) + 1
    }
    
    return this.saveUserData(userId, userData)
  }

  decrementUserField(userId, field, amount) {
    const userData = this.getUserData(userId)
    if (!userData) return false
    
    userData[field] = Math.max(0, (userData[field] || 0) - amount)
    return this.saveUserData(userId, userData)
  }
}

module.exports = new DatabaseManager()