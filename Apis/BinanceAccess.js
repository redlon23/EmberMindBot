const crypto = require("crypto")
const request = require('request-promise');

const base = "https://testnet.binancefuture.com/"
const endPoint = "/fapi/v1/account"

const public = '9e0562c79dbc44344ba26738c70c8ca47bc493ea8f250911cd7b30e9106ef9ab';
const secret = 'cedf05c2d33e3c03344c8220f6aa7aed9538db9d7895da488310a3b8ab609c49';

async function getty(){
    const timeStamp = Date.now();
    let timestampString = `timestamp=${timeStamp}`
    const signature = crypto.createHmac('sha256', secret).update(timestampString).digest('hex')
    let headers = {
        'X-Requested-With': 'XMLHttpRequest',
        'X-MBX-APIKEY': public
    };

    let url = `${base}${endPoint}?timestamp=${timeStamp}&signature=${signature}`;
    const requestOptions = {
        headers: headers,
        url,
        method: "GET",
    };
    console.log(url)

    let data = await request(requestOptions)
    console.log(JSON.parse(data))
}

getty();