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

cron.schedule('*/30 * * * * *', () => {
    logger.log({
        level: 'info',
        message: `Job running every 30 seconds ${new Date()}`
    })
    cowinAvailabilityChecker()
})


async function cowinAvailabilityChecker() {
    let districtId = districtIdMapper.PALGHAR
    const DATE = formatDate(new Date())
    const url = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${DATE}`
    try{
        const response = await axios.get(url)
        let valueString = 'Available! Reserve your slot.\n'
        let flag = false
        if(response.data && response.data.centers){
            let centresObject = response.data.centers
            let requiredData = centresObject.filter((obj) => {
                return preferredPincodeList.includes(obj.pincode)
            })
            Object.keys(requiredData).forEach(i =>{
                Object.keys(requiredData[i].sessions).forEach(j =>{
                    if(requiredData[i].sessions[j].available_capacity !== 0){
                        flag = true
                        let centerName = requiredData[i].name
                        let sessionDate = requiredData[i].sessions[j].date
                        let available_capacity = requiredData[i].sessions[j].available_capacity
                        valueString += `${centerName} available for date ${sessionDate} slot number ${j+1} with capacity of ${available_capacity}\n\n`
                    }
                })
            })
        }
        if(flag){
            runSlackNotifier('', valueString)
        }
    }
    catch(e){
        logger.log({
            level: 'error',
            message: e
        })
        runSlackNotifier('Exception:', e)
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