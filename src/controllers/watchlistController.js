const { Watchlist, Service } = require('../models/watchlist');

exports.addToWatchlist = async (req, res) => {
  try {
    const firebaseId = req.user.uid;
    const { service_id } = req.body;

    if (!service_id) {
      return res.status(400).json({ message: 'service_id is required' });
    }

    await Watchlist.upsert({
      firebase_id: firebaseId,
      service_id
    });

    res.json({ message: 'Added to watchlist successfully' });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getWatchlist = async (req, res) => {
  try {
    const firebaseId = req.user.uid;

    const items = await Watchlist.findAll({
      where: { firebase_id: firebaseId },
      include: [{ model: Service, as: 'service' }]
    });

    res.json(items);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeFromWatchlist = async (req, res) => {
  try {
    const firebaseId = req.user.uid;
    const { service_id } = req.params;

    const deleted = await Watchlist.destroy({
      where: { firebase_id: firebaseId, service_id }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Item not found in watchlist' });
    }

    res.json({ message: 'Removed from watchlist successfully' });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    res.status(500).json({ message: 'Server error' });
  }
};