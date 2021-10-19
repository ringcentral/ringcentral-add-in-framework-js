require('dotenv').config();
const axios = require('axios')

async function run() {
    // compose POST payload
    const payload =
    {
        
    }

    // input your subscriptionId
    const subscriptionId = '';

    const r = await axios.post(
        `${process.env.APP_SERVER}/notification?subscriptionId=${subscriptionId}`,
        payload
    )
    console.log(r.data)
}

run()