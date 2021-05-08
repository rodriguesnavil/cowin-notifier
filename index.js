const axios = require('axios')
require('dotenv').config()
const {
    formatDate,
    preferredPincodeList,
    districtIdMapper
} = require('./utils')
const cron = require('node-cron')
const winston = require('winston')


const logger = winston.createLogger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'info.log' })
    ]
})

cron.schedule('*/5 * * * * *', () => {
    logger.log({
        level: 'info',
        message: `${new Date()}`
    })
    cowinAvailabilityChecker()
})


async function cowinAvailabilityChecker() {
    let districtId = districtIdMapper.PALGHAR
    const DATE = formatDate(new Date())
    const url = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${DATE}&timestamp=${new Date().getTime()}`
    console.log(url)
    try{
        let response = await axios.get(url, 
            {
                headers: {
                'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
                'Content-Type': 'application/json',
                'Cache-Control' : 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        })
        if(response.data && response.data.centers){
            let flag = false
            let valueString = 'RESERVE YOUR SLOT!\n'
            let centresObject = response.data.centers
            let requiredData = centresObject.filter((obj) => {
                return preferredPincodeList.includes(obj.pincode)
            })
            Object.keys(requiredData).forEach(i =>{
                Object.keys(requiredData[i].sessions).forEach(j =>{
                    if(requiredData[i].sessions[j].available_capacity > 0){
                        flag = true
                        let centerName = requiredData[i].name
                        let address = requiredData[i].address
                        let pincode = requiredData[i].pincode
                        let sessionDate = requiredData[i].sessions[j].date
                        let available_capacity = requiredData[i].sessions[j].available_capacity
                        let vaccineName = requiredData[i].sessions[j].vaccine
                        let feeType = requiredData[i].fee_type
                        let minAge = requiredData[i].sessions[j].min_age_limit
                        let timeStamp = new Date().getHours() + ':' +new Date().getMinutes() + ':'+new Date().getSeconds()
                        valueString += `Center name: ${centerName} ( ${pincode} )\nMinimum Age: ${minAge}\nAddress: ${address} \nAvailable date: ${sessionDate}\nCapacity: ${available_capacity}\nVaccine name: ${vaccineName}\nFee Type: ${feeType}\nTimeStamp: ${timeStamp}\n\n*************************************\n`
                    }
                })
            })
            if(flag){
                runSlackNotifier('', valueString)
            }
        }
    }
    catch(e){
        logger.log({
            level: 'error',
            message: e
        })
        runSlackNotifier('Error:', e)
    }
}

async function runSlackNotifier(key, value) {
    logger.log({level: 'info', message: 'Slack notification triggered'})
    const url = 'https://slack.com/api/chat.postMessage';
    const slackToken = process.env.SLACK_TOKEN
    await axios.post(url, {
      channel: '#cowin-update',
      text: `${key} ${value}`
    }, { headers: { authorization: `Bearer ${slackToken}` } })
}
