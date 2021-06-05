# cowin-notifier

### Description

In this project we have implemeted a notifier for vaccination based on users current location which can eithe be a combination of state and district or a pincode. The notification is send over slack to a register slack user who has subscribed to the notification channel.

### Libraries used

|Library|Version|
|-------|:-----:|
|[axios](https://www.npmjs.com/package/axios)|0.21.1|
|[dotenv](https://www.npmjs.com/package/dotenv)|8.2.0|
|[node-cron](https://www.npmjs.com/package/node-cron)|3.0.0|
|[winston](https://www.npmjs.com/package/winston)|3.3.3|
|[@slack/events-api](https://slack.dev/node-slack-sdk/events-api)|3.0.0|
|[@slack/web-api](https://api.slack.com/web)|6.1.0|

### Working

In order to understand the working of this notifier we will take a look at two functions and a module whose names are specified below

* cron.schedule
* cowinAvailabilityChecker
* runSlackNotifier

#### cron.schedule
- the cron.schedule is a module which is mainly used for running a job after a particular duration. In this case we have used it to run after every 30 seconds as you can see below

```
cron.schedule('*/30 * * * * *', () => {
    logger.log({
        level: 'info',
        message: `Job running every 30 seconds ${new Date()}`
    })
    cowinAvailabilityChecker()
})
```

- As you can see we will call our function `cowinAvailabilityChecker` after every 30 seconds in order to check for available slots 
- The job also logs the current date and time using the `winston` library

#### cowinAvailabilityChecker

- This function is called in the `cron.schedule` module after every 30 seconds.
- The functions uses `axios` to hit the url  `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${DATE}` where `DATE` is the current date and `districtId` is district id that is provided by the url `https://cdn-api.co-vin.in/api/v2/admin/location/districts/21`.
- The function creates a message of the format `Center name: ${centerName} ( ${pincode} ) \nAvailable date: ${sessionDate} \nSlot number: ${j+1} \nCapacity: ${available_capacity} \nVaccine name: ${vaccineName}\n\n`, which tells about details such as center name, pincode, vaccine name, available capacity and session date along with slot number
- This message is then sent over slack to all subscribed user

###### Note: - the url `https://cdn-api.co-vin.in/api/v2/admin/location/districts/21` is specific to the state of Maharashtra only

#### runSlackNotifier
- The `runSlackNotifier` function is where the notifier actually send the notification.
- In order to use slack we need to generate a slack token and use it as below
```
    const url = 'https://slack.com/api/chat.postMessage';
    const slackToken = process.env.SLACK_TOKEN_V2
```
- The slack token is an authorization token that is sent in the header in order to ensure security and limit the api use
- Below we can see how it is used to send a request with axios
```
    await axios.post(url, {
      channel: '#notification',
      text: `${key} ${value}`
    }, { headers: { authorization: `Bearer ${slackToken}` } })
```
- The `key` and `value` are a pair where key identifies the message and value is the message itself.
- In our use case we use an empty string as key to send a notification message and `Exception` as key to identify any exceptions on server


### Running the notifier

** Below are the instructions to run the notifier **
- `npm run install`
- `node index.js` 
