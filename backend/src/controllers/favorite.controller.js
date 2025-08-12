
const Customer = require('../models/customer');
const { Service } = require('../models/associations'); // MySQL model via Sequelize

exports.addFavorite = async (req, res) => {
  try {
    const { serviceId } = req.body;
    const firebaseUid = req.user.uid; // Get from Firebase auth middleware
    
    console.log('Add favorite request:', { firebaseUid, serviceId, serviceIdType: typeof serviceId });
    
    if (!serviceId) {
      console.log('Missing serviceId');
      return res.status(400).json({ message: 'Thiếu serviceId' });
    }
    
    // Find customer by Firebase UID
    const customer = await Customer.findOne({ where: { firebase_id: firebaseUid } });
    if (!customer) {
      console.log('Customer not found for Firebase UID:', firebaseUid);
      return res.status(404).json({ message: 'Không tìm thấy customer' });
    }
    
    let favorites = [];
    if (customer.favorite_services) {
      favorites = JSON.parse(customer.favorite_services);
    }
    console.log('Current favorites:', favorites, 'types:', favorites.map(f => typeof f));
    
    // Ensure consistency - convert to string
    const serviceIdStr = String(serviceId);
    if (!favorites.includes(serviceIdStr)) {
      favorites.push(serviceIdStr);
      await customer.update({ favorite_services: JSON.stringify(favorites) });
      console.log('Added to favorites. New favorites:', favorites);
    } else {
      console.log('Service already in favorites');
    }
    
    res.json({ message: 'Đã thêm vào danh sách yêu thích', favorite_services: favorites });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const { serviceId } = req.body;
    const firebaseUid = req.user.uid; // Get from Firebase auth middleware
    
    console.log('Remove favorite request:', { firebaseUid, serviceId, serviceIdType: typeof serviceId });
    
    if (!serviceId) {
      console.log('Missing serviceId');
      return res.status(400).json({ message: 'Thiếu serviceId' });
    }
    
    // Find customer by Firebase UID
    const customer = await Customer.findOne({ where: { firebase_id: firebaseUid } });
    if (!customer) {
      console.log('Customer not found for Firebase UID:', firebaseUid);
      return res.status(404).json({ message: 'Không tìm thấy customer' });
    }
    
    let favorites = [];
    if (customer.favorite_services) {
      favorites = JSON.parse(customer.favorite_services);
    }
    console.log('Current favorites:', favorites, 'types:', favorites.map(f => typeof f));
    
    // Ensure consistency - convert to string
    const serviceIdStr = String(serviceId);
    favorites = favorites.filter(id => String(id) !== serviceIdStr);
    await customer.update({ favorite_services: JSON.stringify(favorites) });
    console.log('Removed from favorites. New favorites:', favorites);
    
    res.json({ message: 'Đã xóa khỏi danh sách yêu thích', favorite_services: favorites });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.listFavorites = async (req, res) => {
  try {
    const firebaseUid = req.user.uid; // Get from Firebase auth middleware
    console.log('List favorites for Firebase UID:', firebaseUid);
    
    // Find customer by Firebase UID
    const customer = await Customer.findOne({ where: { firebase_id: firebaseUid } });
    if (!customer) {
      console.log('Customer not found for Firebase UID:', firebaseUid);
      return res.status(404).json({ message: 'Không tìm thấy customer' });
    }
    
    let favorites = [];
    if (customer.favorite_services) {
      favorites = JSON.parse(customer.favorite_services);
    }
    console.log('Customer favorites IDs:', favorites);
    
    // Truy vấn chi tiết dịch vụ từ MySQL qua Sequelize
    const services = await Service.findAll({
      where: { service_id: favorites }
    });
    
    res.json(services);
  } catch (error) {
    console.error('List favorites error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// API để chỉ lấy danh sách IDs yêu thích (cho hook useFavoriteServices)
exports.listFavoriteIds = async (req, res) => {
  try {
    const firebaseUid = req.user.uid; // Get from Firebase auth middleware
    console.log('List favorite IDs for Firebase UID:', firebaseUid);
    
    // Find customer by Firebase UID
    const customer = await Customer.findOne({ where: { firebase_id: firebaseUid } });
    if (!customer) {
      console.log('Customer not found for Firebase UID:', firebaseUid);
      return res.status(404).json({ message: 'Không tìm thấy customer' });
    }
    
    let favorites = [];
    if (customer.favorite_services) {
      favorites = JSON.parse(customer.favorite_services);
    }
    console.log('Customer favorite IDs:', favorites);
    
    // Return array of objects with id property for consistency
    const favoriteData = favorites.map(id => ({ id: String(id) }));
    res.json(favoriteData);
  } catch (error) {
    console.error('Error getting favorite IDs:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// API để lấy chi tiết dịch vụ yêu thích (cho trang favorite)
exports.getFavoriteServicesDetails = async (req, res) => {
  const { customerId } = req.params;
  console.log('Get favorite services details for customer:', customerId);
  
  try {
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      console.log('Customer not found:', customerId);
      return res.status(404).json({ message: 'Không tìm thấy customer' });
    }
    
    let favorites = [];
    if (customer.favorite_services) {
      favorites = JSON.parse(customer.favorite_services);
    }
    console.log('Customer favorites IDs:', favorites);
    
    if (favorites.length === 0) {
      console.log('No favorites found');
      return res.json([]);
    }

    // Truy vấn chi tiết dịch vụ từ MySQL qua Sequelize
    const services = await Service.findAll({
      where: { service_id: favorites }
    });

    res.json(services);
  } catch (error) {
    console.error('Error getting favorite services details:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};
