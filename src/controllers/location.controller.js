const axios = require('axios');
const Location = require('../models/location');
const Customer = require('../models/customer');

const createLocation = async (req, res) => {
    try {
        // Lấy firebase UID từ token đã verify
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Tìm customer_id từ firebase_uid
        const customer = await Customer.findOne({
            where: { firebase_id: firebaseUid },
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const userId = customer.customer_id;

        const { longtitude, latitude, city, district, detail } = req.body;
        if (!detail || !longtitude || !latitude || !city || !district) {
            return res.status(400).json({ error: 'Missing address field' });
        }

        // Lưu vào database
        const newLoc = await Location.create({
            customer_id: userId,
            longtitude: longtitude,
            latitude: latitude,
            city: city,
            district: district,
            detail: detail,
        });

        return res.status(201).json(newLoc);
    } catch (err) {
        console.error('❌ createLocation error:', err);
        return res.status(500).json({ error: err.message });
    }
};

const getLocation = async (req, res) => {
    try {
        // Lấy firebase UID từ token đã verify
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Tìm customer_id từ firebase_uid
        const customer = await Customer.findOne({
            where: { firebase_id: firebaseUid },
        });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const userId = customer.customer_id;

        // Lấy tất cả bản ghi location của user
        const locs = await Location.findAll({
            where: { customer_id: userId },
            attributes: ['detail'],
        });

        // Chỉ trả về detail và address
        const result = locs.map((loc) => ({
            address: `${loc.detail}`
        }));

        return res.json(result);
    } catch (err) {
        console.error('❌ getLocation error:', err);
        return res.status(500).json({ error: err.message });
    }
};

const autocompleteLocation = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Missing query parameter' });
        }
        const apiKey = process.env.GOONG_API_KEY;
        // 1) fetch raw place descriptions
        const autoUrl = `https://rsapi.goong.io/Place/AutoComplete?api_key=${apiKey}&input=${encodeURIComponent(query)}`;
        
        const { data } = await axios.get(autoUrl);
        if (!data.predictions) {
            return res
                .status(500)
                .json({ error: 'Unexpected API response format' });
        }

        // 2) for each description, forward-geocode to get lat/lon
        const suggestions = await Promise.all(
            data.predictions.map(async (p) => {
                const geoUrl = `https://rsapi.goong.io/geocode?address=${encodeURIComponent(
                    p.description
                )}&api_key=${apiKey}`;
                const geoResp = await axios.get(geoUrl);
                const first = geoResp.data.results?.[0];
                return {
                    name: p.description,
                    lat: first?.geometry?.location?.lat ?? null,
                    lon: first?.geometry?.location?.lng ?? null,
                    district: first?.compound?.district ?? null,
                    city: first?.compound?.province ?? null,
                };
            })
        );

        return res.json(suggestions);
    } catch (err) {
        console.error('❌ autocompleteLocation error:', err);
        return res.status(500).json({ error: err.message });
    }
};

const reverseGeocoding = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Missing lat or lng query parameter' });
    }
    const apiKey = process.env.GOONG_API_KEY;
    const url = `https://rsapi.goong.io/Geocode?latlng=${encodeURIComponent(lat + "," + lng)}&api_key=${apiKey}`;
    const { data } = await axios.get(url);
    // const displayName = resp.data.display_name;
    console.log('reverseGeocoding response:', data);
    return res.json( {
      address: data.results?.[0]?.formatted_address || null,
      district: data.results?.[0]?.compound?.district || null,
      city: data.results?.[0]?.compound?.province || null,
    } );
  } catch (err) {
    console.error('❌ reverseGeocoding error:', err);
    return res.status(500).json({ error: err.message });
  }
};

const forwardGeocoding = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address) {
      return res.status(400).json({ error: 'Missing address field' });
    }
    const apiKey = process.env.GOONG_API_KEY;
    const url = `https://rsapi.goong.io/geocode?address=${encodeURIComponent(address)}&api_key=${apiKey}`;
    const { data } = await axios.get(url);
    return res.json(data);
  } catch (err) {
    console.error('❌ forwardGeocoding error:', err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
    createLocation,
    getLocation,
    autocompleteLocation,
    reverseGeocoding,
    forwardGeocoding
};
