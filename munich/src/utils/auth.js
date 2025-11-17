// Authentication configuration for Munich Re
export const USERS = {
  pallavi: { username: 'pallavi', password: 'nttdata' },
  kanav: { username: 'kanav', password: 'nttdata' },
  devesh: { username: 'devesh', password: 'nttdata' },
  pankaj: { username: 'pankaj', password: 'nttdata' },
  divvijay: { username: 'divvijay', password: 'nttdata' }
}

export const authenticateUser = (username, password) => {
  const user = USERS[username.toLowerCase()]
  if (user && user.password === password) {
    return { success: true, username: user.username }
  }
  return { success: false, message: 'Invalid username or password' }
}

export const isAuthenticated = () => {
  return localStorage.getItem('munichAuthToken') !== null
}

export const setAuthToken = (username) => {
  localStorage.setItem('munichAuthToken', username)
}

export const getAuthToken = () => {
  return localStorage.getItem('munichAuthToken')
}

export const logout = () => {
  localStorage.removeItem('munichAuthToken')
}

