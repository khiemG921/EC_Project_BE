const Customer = require('../models/customer');
const Service = require('../models/service');

// Add a service to customer's watchlist_services
exports.addToWatchlist = async (req, res) => {
  try {
    const firebaseId = req.user.uid;
    // Frontend send serviceId or service_id
    const serviceId = req.body.serviceId || req.body.service_id;

    if (!serviceId) {
      return res.status(400).json({ message: 'serviceId is required' });
    }

    const customer = await Customer.findOne({ where: { firebase_id: firebaseId } });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    let list = [];
    if (customer.watchlist_services) {
      try { list = JSON.parse(customer.watchlist_services) || []; } catch { list = []; }
    }

    const idStr = String(serviceId);
    if (!list.includes(idStr)) {
      list.push(idStr);
      await customer.update({ watchlist_services: JSON.stringify(list) });
    }

    // Return the full service for convenience
    const service = await Service.findByPk(serviceId, {
      attributes: [
        ['service_id', 'id'],
        'name',
        'description',
        'type',
        'image_url',
        'status'
      ]
    });
    return res.json({ message: 'Added to watchlist successfully', service });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Return list of services in watchlist
exports.getWatchlist = async (req, res) => {
  try {
    const firebaseId = req.user.uid;
    const customer = await Customer.findOne({ where: { firebase_id: firebaseId } });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    let list = [];
    if (customer.watchlist_services) {
      try { list = JSON.parse(customer.watchlist_services) || []; } catch { list = []; }
    }

    if (!Array.isArray(list) || list.length === 0) return res.json([]);

    const services = await Service.findAll({
      where: { service_id: list },
      attributes: [
        ['service_id', 'id'],
        'name',
        'description',
        'type',
        'image_url',
        'status'
      ]
    });
    // Keep compatibility with current frontend hook expecting [{ service: {...} }]
    const items = services.map(s => ({ service: s }));
    return res.json(items);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove a service from watchlist by service_id param
exports.removeFromWatchlist = async (req, res) => {
  try {
    const firebaseId = req.user.uid;
    const { service_id } = req.params;
    const serviceId = service_id;

    const customer = await Customer.findOne({ where: { firebase_id: firebaseId } });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    let list = [];
    if (customer.watchlist_services) {
      try { list = JSON.parse(customer.watchlist_services) || []; } catch { list = []; }
    }

    const prevLen = list.length;
    list = list.filter(id => String(id) !== String(serviceId));
    if (list.length !== prevLen) {
      await customer.update({ watchlist_services: JSON.stringify(list) });
    }

    return res.json({ message: 'Removed from watchlist successfully' });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};