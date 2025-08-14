const axios = require('axios');
const crypto = require('crypto');
const client = require('../config/paypal');
const checkout = require('@paypal/checkout-server-sdk');
const CryptoJS = require('crypto-js');
const moment = require('moment');

const createPaypalOrder = async (req, res) => {
    try {
        const { amount } = req.body; // USD string, ví dụ "12.34"
        const request = new checkout.orders.OrdersCreateRequest();
        request.prefer('return=representation');
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: 'USD',
                        value: amount,
                    },
                },
            ],
        });

        const order = await client.execute(request);
        // trả về toàn bộ order.result, trong đó có links[ { rel: 'approve', href: ... } ]
        return res.json(order.result);
    } catch (err) {
        console.error('❌ createPaypalOrder error:', err);
        return res.status(500).json({ error: err.message });
    }
};

const capturePaypalOrder = async (req, res) => {
    try {
        const { orderID } = req.body;
        const request = new checkout.orders.OrdersCaptureRequest(orderID);
        request.prefer('return=representation');
        const capture = await client.execute(request);
        return res.json(capture.result);
    } catch (err) {
        console.error('❌ capturePaypalOrder error:', err);
        return res.status(500).json({ error: err.message });
    }
};

const createMoMoOrder = async (req, res) => {
    try {
        const { amount, orderInfo, jobId } = req.body;
        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;
        const requestId = `${partnerCode}${Date.now()}`;
        const orderId = requestId;
        const redirectUrl = process.env.MOMO_REDIRECT_URL;
        const ipnUrl = process.env.MOMO_IPN_URL;
        const extraData = JSON.stringify({ jobId });

        const rawSignature =
            'accessKey=' + accessKey +
            '&amount=' + amount +
            '&extraData=' + extraData +
            '&ipnUrl=' + ipnUrl +
            '&orderId=' + orderId +
            '&orderInfo=' + orderInfo +
            '&partnerCode=' + partnerCode +
            '&redirectUrl=' + redirectUrl +
            '&requestId=' + requestId +
            '&requestType=' + 'payWithATM';


        const signature = crypto
            .createHmac('sha256', secretKey.toString())
            .update(rawSignature)
            .digest('hex');

        const requestBody = JSON.stringify({
            partnerCode : partnerCode,
            partnerName : 'CleanNow',
            storeId : 'CleanNowTest',
            requestId : requestId,
            amount : amount,
            orderId : orderId,
            orderInfo : orderInfo,
            redirectUrl : redirectUrl,
            ipnUrl : ipnUrl,
            lang : 'en',
            requestType: 'payWithATM',
            autoCapture: true,
            extraData : extraData,
            orderGroupId: '',
            signature : signature
        });

        const { data: momoRes } = await axios.post(
            'https://test-payment.momo.vn/v2/gateway/api/create',
            requestBody,
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (momoRes.resultCode !== 0) {
            return res.status(400).json({ error: momoRes.localMessage });
        }
        return res.json({ payUrl: momoRes.payUrl, requestId, orderId });
    } catch (err) {
        console.error('❌ createMoMoOrder error:', err);
        return res.status(500).json({ error: err.message });
    }
};

const createZaloPayOrder = async (req, res) => {
    try {
        const { amount, orderInfo, jobId } = req.body;
        const appId = process.env.ZALOPAY_APP_ID;
        const key1 = process.env.ZALOPAY_KEY_1;
        const endpoint =
            process.env.ZALOPAY_ENDPOINT ||
            'https://sb-openapi.zalopay.vn/v2/create';
        const returnUrl = `${process.env.ZALOPAY_REDIRECT_URL}?jobId=${jobId}`;

        const embedData = JSON.stringify({ redirecturl: returnUrl });
        const items = JSON.stringify([]);
        const appTransId = `${moment().format('YYMMDD')}_${Math.floor(
            Math.random() * 1000000
        )}`;
        const appUser = req.user?.uid || 'anonymous';
        const appTime = Date.now();

        // data string theo tài liệu ZaloPay
        const rawData = `${appId}|${appTransId}|${appUser}|${amount}|${appTime}|${embedData}|${items}`;
        const mac = CryptoJS.HmacSHA256(rawData, key1).toString();

        const params = {
            app_id: Number(appId),
            app_trans_id: appTransId,
            app_user: appUser,
            app_time: appTime,
            item: items,
            embed_data: embedData,
            amount: Number(amount),
            description: orderInfo,
            bank_code: 'zalopayapp',
            mac,
        };

        const { data: zaloRes } = await axios.post(endpoint, null, { params });
        if (zaloRes.return_code !== 1) {
            return res.status(400).json({ error: zaloRes.return_message });
        }

        return res.json({
            order_token: zaloRes.order_token,
            transId: zaloRes.app_trans_id,
            order_url: zaloRes.pay_url || zaloRes.order_url,
        });
    } catch (err) {
        console.error('❌ createZaloPayOrder error:', err);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    createPaypalOrder,
    capturePaypalOrder,
    createMoMoOrder,
    createZaloPayOrder,
};
