const axios = require('axios')
const fs = require('fs')
const { preferredPincodeList } = require('./utils')
require('dotenv').config()



const url = `https://cdn-api.co-vin.in/api/v2/admin/location/districts/${21}`


async function getDistrictsMah()
{
    try{

        districtIds = []
        const response = await axios.get(url,
            {
                headers: { 
                'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
                }
            }
        )
        if(response.data && response.data.districts)
        {
            let districtObject = response.data.districts
            Object.keys(districtObject).forEach(obj=>{
                distName =  districtObject[obj].district_name
                distId =  districtObject[obj].district_id
                distObj = {
                   [distName]:distId
                }
                districtIds.push(distObj) 
            })
            console.log(districtIds)
            districts = {
                "districts":districtIds
            }
            fs.writeFile('districtMapper.json',JSON.stringify(districts), function (err) {
                if (err) throw err;
                console.log('Saved!');
            });
        }
    }
    catch(ex)
    {
        console.log(ex)
    }
}

async function getDistrictPincodes()
{
    try{
        districtIds = []
       
        var obj;
        fs.readFile('districtMapper.json', 'utf8', async (err, data)=> {
            if (err) throw err;
            obj = JSON.parse(data);
            districts = obj['districts']
            distNames = []
            for(let i=0;i<districts.length;i++)
            {
                keys = Object.keys(districts[i])
                distNames.push(keys[0])
            }

            var preferredPincodeList = []
            for(let i = 0; i<distNames.length-10;i++)
            {
                let name = distNames[i]
                let id = districts[i][name]
                const url = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?date=06-05-2021&district_id=${id}`
                console.log(url)
                const response = await axios.get(url,
                    {
                        headers: { 
                        'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
                        }
                })

                if(response.data && response.data.centers)
                {
                   let centers = response.data.centers
                   let = preferedCodesList = []
                   for(let j=0;j<centers.length;j++)
                   {
                        preferedCodesList.push(centers[j].pincode)
                   }
                   preferedCode ={
                       [id]:preferedCodesList
                   }
                   preferredPincodeList.push(preferedCode)
                }
            }

            preferedCodes={
                "pincodes":preferredPincodeList
            }
            fs.writeFile('preferredPincodeList.json',JSON.stringify(preferedCodes),       function (err) {
                if (err) throw err;
                console.log('Saved!');
            });

           

            
        });
       
    }
    catch(ex)
    {
        console.log(ex)
    }
}

// getDistrictsMah()
// getDistrictPincodes()
