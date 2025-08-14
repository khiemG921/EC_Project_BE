const { MongoClient } = require('mongodb');

const services = [
    {
        id: 1,
        name: 'Giúp Việc Ca Lẻ',
        description: 'Dọn dẹp ngắn hạn theo giờ và linh hoạt lịch, phù hợp cho những ai cần hỗ trợ đột xuất.',
        type: 'Dịch Vụ Phổ Biến',
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
        basePrice: 120000,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 2,
        name: 'Giúp Việc Định Kỳ',
        description: 'Dọn dẹp định kỳ hàng tuần hoặc hàng tháng, giữ nhà cửa luôn sạch sẽ và ngăn nắp.',
        type: 'Dịch Vụ Phổ Biến',
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400',
        basePrice: 150000,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 3,
        name: 'Tổng Vệ Sinh',
        description: 'Vệ sinh tổng thể cho mọi không gian trong nhà, từ phòng khách đến nhà bếp và phòng tắm.',
        type: 'Dịch Vụ Phổ Biến',
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400',
        basePrice: 200000,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 4,
        name: 'Vệ Sinh Sofa, Đệm, Rèm, Thảm',
        description: 'Làm sạch đồ vải trong nhà nhanh gọn với công nghệ hiện đại, an toàn cho sức khỏe.',
        type: 'Dịch Vụ Phổ Biến',
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
        basePrice: 180000,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 5,
        name: 'Vệ Sinh Điều Hòa',
        description: 'Bảo dưỡng và làm sạch máy lạnh, tăng hiệu suất làm mát và tiết kiệm điện.',
        type: 'Dịch Vụ Bảo Dưỡng Điện Máy',
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400',
        basePrice: 250000,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 6,
        name: 'Vệ Sinh Văn Phòng',
        description: 'Dọn dẹp văn phòng chuyên nghiệp, duy trì môi trường làm việc sạch sẽ và chuyên nghiệp.',
        type: 'Dịch Vụ Dành Cho Doanh Nghiệp',
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
        basePrice: 300000,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 7,
        name: 'Chăm Sóc Người Cao Tuổi',
        description: 'Hỗ trợ sinh hoạt và chăm sóc sức khỏe cho người cao tuổi với đội ngũ chuyên nghiệp.',
        type: 'Dịch Vụ Chăm Sóc',
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
        basePrice: 400000,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 8,
        name: 'Giặt Ủi',
        description: 'Dịch vụ giặt ủi chuyên nghiệp, giao nhận tận nơi, tiết kiệm thời gian cho bạn.',
        type: 'Dịch Vụ Tiện Ích Nâng Cao',
        status: 'active',
        imageUrl: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=400',
        basePrice: 80000,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

async function seedServices() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('cleaning_service');
        const collection = db.collection('services');
        
        // Xóa dữ liệu cũ
        await collection.deleteMany({});
        console.log('Cleared existing services');
        
        // Thêm dữ liệu mới
        const result = await collection.insertMany(services);
        console.log(`Inserted ${result.insertedCount} services`);
        
    } catch (error) {
        console.error('Error seeding services:', error);
    } finally {
        await client.close();
    }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
    seedServices();
}

module.exports = { seedServices };
