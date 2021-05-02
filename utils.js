const formatDate = (date) => {
  if (date) {
    date = new Date(date)
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let dt = date.getDate()
    if (dt < 10) {
      dt = '0' + dt
    }
    if (month < 10) {
      month = '0' + month
    }
    return `${dt}/${month}/${year}`
  } else {
    return date
  }
}

const pincodeList = [
  401301,
  401302,
  401303,
  401203,
  401201,
  401304,
  401207,
  401305,
  401208
]

module.exports = {
  formatDate,
  pincodeList
}