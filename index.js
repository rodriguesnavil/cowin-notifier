const axios = require('axios')
require('dotenv').config()
const {
    formatDate,
    pincodeList
} = require('./utils')
const cron = require('node-cron')
const winston = require('winston')


const logger = winston.createLogger({
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'info.log' })
    ]
})

cron.schedule('*/5 * * * *', () => {
    console.log('Cron is running')
    logger.log({
        level: 'info',
        message: `Cron is running, Time:${new Date()}`
    })
    cowinAvailabilityChecker().catch(err => runSlackNotifier('Error occured:',err))
})


async function cowinAvailabilityChecker() {
    let district = 394
    const today = formatDate(new Date())
    const url = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${district}&date=${today}`
    try{
        const response = await axios.get(url)
        if(response.data && response.data.centers){
            let centresObject = response.data.centers
            let requiredData = centresObject.filter((obj) => {
                return pincodeList.includes(obj.pincode)
            })
            Object.keys(requiredData).forEach(i =>{
                Object.keys(requiredData[i].sessions).forEach(j =>{
                    if(requiredData[i].sessions[j].available_capacity !== 0){
                        runSlackNotifier(requiredData[i].name, requiredData[i].sessions[j].date)
                    }
                })
            })
        }
    }
    catch(e){
        logger.log({
            level: 'error',
            message: e
        })
        runSlackNotifier('Exception occured:', e)
    }
}

async function runSlackNotifier(centerName, availabilityDate) {
    const url = 'https://slack.com/api/chat.postMessage';
    const slackToken = process.env.SLACK_TOKEN
    await axios.post(url, {
      channel: '#cowin-update',
      text: `${centerName}: ${availabilityDate}`
    }, { headers: { authorization: `Bearer ${slackToken}` } })
}