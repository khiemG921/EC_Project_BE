const { Op } = require('sequelize');
const Voucher = require('../models/voucher');
const ServiceDetail = require('../models/service_detail');

const checkoutHourly = async (req, res) => {
    const {
        staff_count,
        cleaning_duration,
        vacuum,
        cooking,
        laundry,
        voucher_code,
    } = req.body;
    const service_id = 1;

    console.log('checkoutHourly called with:', req.body);

    if (!staff_count || !cleaning_duration) {
        console.log('Missing required fields:', {
            staff_count,
            cleaning_duration,
        });
        return res
            .status(400)
            .json({ error: 'Thiếu trường thông tin cần thiết.' });
    }

    try {
        let totalPrice = 0;
        let discount = 0;
        const breakdown = [];

        const cleanDetail = await ServiceDetail.findOne({
            where: { service_id, duration: cleaning_duration },
        });

        if (!cleanDetail) {
            console.log('Service detail not found for:', {
                service_id,
                duration: cleaning_duration,
            });
            return res.status(404).json({ error: 'Không tìm thấy detail.' });
        }

        console.log('Found cleanDetail:', cleanDetail);

        const cleanSub = cleanDetail.price * staff_count;
        totalPrice += cleanSub;
        breakdown.push({
            service: 'hourly',
            name: cleanDetail.name,
            unitPrice: cleanDetail.price,
            multiplier: staff_count,
            subTotal: cleanSub,
        });

        const extras = [
            { flag: vacuum, name: 'Sử dụng máy hút bụi' },
            { flag: cooking, name: 'Nấu ăn' },
            { flag: laundry, name: 'Giặt ủi' },
        ];
        for (const ex of extras) {
            if (ex.flag) {
                const det = await ServiceDetail.findOne({
                    where: { service_id, name: ex.name },
                });
                if (det) {
                    const sub = det.price * staff_count;
                    totalPrice += sub;
                    breakdown.push({
                        service: 'hourly',
                        name: ex.name,
                        unitPrice: det.price,
                        multiplier: staff_count,
                        subTotal: sub,
                    });
                }
            }
        }

        let appliedVoucher = null;
        // const customer_id = req.user?.id;
        if (voucher_code) {
            appliedVoucher = await Voucher.findOne({
                attributes: ['discount_percentage'],
                where: {
                    // customer_id,
                    voucher_code,
                    expiry_date: { [Op.gt]: new Date() },
                },
                raw: true,
            });
            if (appliedVoucher) {
                discount =
                    totalPrice * (appliedVoucher.discount_percentage / 100);
            }
        }

        if (discount > 0) {
            totalPrice -= discount;
        }

        return res.json({ totalPrice, discount, breakdown });
    } catch (err) {
        console.error('checkout error:', err);
        return res.status(500).json({ error: 'System error' });
    }
};

const checkoutPeriodic = async (req, res) => {
    const {
        duration,
        daysPerWeek,
        months,
        cooking,
        shopping,
        laundry,
        vacuum,
        voucher_code,
    } = req.body;

    const service_id = 2;
    if (!duration || !daysPerWeek || !months) {
        return res
            .status(400)
            .json({ error: 'Thiếu duration, daysPerWeek hoặc months.' });
    }

    try {
        let totalPrice = 0;
        let discount = 0;
        const breakdown = [];

        // --- tính base price + package discount ---
        const baseDetail = await ServiceDetail.findOne({
            where: { service_id, duration },
        });

        if (!baseDetail) {
            return res.status(404).json({ error: 'Không tìm thấy detail.' });
        }

        let sessionCount = daysPerWeek * months * 4;
        if (months === 1) sessionCount += 1;
        else if (months === 3) sessionCount += 2;
        else if (months === 6) sessionCount += 3;

        let baseSub = baseDetail.price * sessionCount;
        // giữ lại discount theo gói tháng
        if (months === 3) {
            const pkgDisc = baseSub * 0.1; // 10%
            baseSub -= pkgDisc;
            discount += pkgDisc;
        } else if (months === 6) {
            const pkgDisc = baseSub * 0.15; // 15%
            baseSub -= pkgDisc;
            discount += pkgDisc;
        }

        totalPrice += baseSub;
        breakdown.push({
            service: 'periodic',
            name: baseDetail.name,
            unitPrice: baseDetail.price,
            multiplier: sessionCount,
            subTotal: baseSub,
        });

        // --- cộng extras ---
        const extras = [
            { flag: cooking, name: 'Nấu ăn' },
            { flag: shopping, name: 'Đi chợ' },
            { flag: laundry, name: 'Giặt ủi' },
            { flag: vacuum, name: 'Sử dụng máy hút bụi' },
        ];
        for (const ex of extras) {
            if (ex.flag) {
                const det = await ServiceDetail.findOne({
                    where: { service_id, name: ex.name },
                });
                if (det) {
                    const sub = det.price * sessionCount;
                    totalPrice += sub;
                    breakdown.push({
                        service: 'periodic',
                        name: det.name,
                        unitPrice: det.price,
                        multiplier: sessionCount,
                        subTotal: sub,
                    });
                }
            }
        }

        // --- áp dụng voucher discount giống checkoutHourly ---
        if (voucher_code) {
            // const customer_id = req.user?.id;
            const appliedVoucher = await Voucher.findOne({
                attributes: ['discount_percentage'],
                where: {
                    // customer_id,
                    voucher_code,
                    expiry_date: { [Op.gt]: new Date() },
                },
                raw: true,
            });
            if (appliedVoucher) {
                const voucherDisc =
                    totalPrice * (appliedVoucher.discount_percentage / 100);
                totalPrice -= voucherDisc;
                discount += voucherDisc;
            }
        }

        return res.json({ totalPrice, discount, breakdown });
    } catch (err) {
        console.error('checkoutPeriodic error:', err);
        return res.status(500).json({ error: 'System error' });
    }
};

const checkoutACCleaning = async (req, res) => {
    const {
        wall_mounted_b2,
        wall_mounted_a2,
        floor_standing,
        concealed,
        gas,
        voucher_code,
    } = req.body;

    const service_id = 5;
    if (!wall_mounted_b2 && !wall_mounted_a2 && !floor_standing && !concealed) {
        return res.status(400).json({ error: 'Thiếu thông tin dịch vụ.' });
    }

    try {
        let discount = 0;
        let totalPrice = 0;
        const breakdown = [];

        const addItem = (name, price, quantity) => {
            const subTotal = price * quantity;
            totalPrice += subTotal;
            breakdown.push({
                service: 'AC Cleaning',
                name,
                unitPrice: price,
                multiplier: quantity,
                subTotal,
            });
        };

        if (wall_mounted_b2) {
            const detail = await ServiceDetail.findOne({
                where: { service_id, name: 'Máy lạnh treo tường dưới 2HP' },
            });
            if (detail) addItem(detail.name, detail.price, wall_mounted_b2);
        }

        if (wall_mounted_a2) {
            const detail = await ServiceDetail.findOne({
                where: {
                    service_id,
                    name: 'Máy lạnh treo tường từ 2HP trở lên',
                },
            });
            if (detail) addItem(detail.name, detail.price, wall_mounted_a2);
        }

        if (floor_standing) {
            const detail = await ServiceDetail.findOne({
                where: { service_id, name: 'Máy lạnh tủ đứng' },
            });
            if (detail) addItem(detail.name, detail.price, floor_standing);
        }

        if (concealed) {
            const detail = await ServiceDetail.findOne({
                where: { service_id, name: 'Máy lạnh âm tường' },
            });
            if (detail) addItem(detail.name, detail.price, concealed);
        }

        if (gas) {
            const detail = await ServiceDetail.findOne({
                where: { service_id, name: 'Bơm gas' },
            });
            if (detail) addItem(detail.name, detail.price, gas);
        }

        // Áp dụng voucher nếu có
        if (voucher_code) {
            const v = await Voucher.findOne({
                where: {
                    voucher_code,
                    expiry_date: { [Op.gt]: new Date() },
                },
                attributes: ['discount_percentage'],
                raw: true,
            });
            if (v) {
                discount = totalPrice * (v.discount_percentage / 100);
                totalPrice -= discount;
            }
        }

        return res.json({ totalPrice, discount, breakdown });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'System error' });
    }
};

const checkoutUpholstery = async (req, res) => {
    const { selectedItems } = req.body;
    const service_id = 4;
    if (!selectedItems || Object.keys(selectedItems).length === 0) {
        return res.status(400).json({ error: 'Thiếu thông tin dịch vụ.' });
    }

    try {
        let totalPrice = 0;
        const breakdown = [];

        for (const [idKey, qty] of Object.entries(selectedItems)) {
            const id = parseInt(idKey, 10);
            if (!qty || qty <= 0) continue;
            const detail = await ServiceDetail.findOne({
                where: { service_id, service_detail_id: id },
            });
            if (detail) {
                const subTotal = detail.price * qty;
                totalPrice += subTotal;
                breakdown.push({
                    service: 'upholstery',
                    name: detail.name,
                    unitPrice: detail.price,
                    multiplier: qty,
                    subTotal,
                });
            }
        }

        return res.json({ totalPrice, breakdown });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'System error' });
    }
};

const checkoutBusinessCleaning = async (req, res) => {
    const { selectedItems, area, voucher_code } = req.body;
    const service_id = 8;

    if (!Array.isArray(selectedItems) || selectedItems.length === 0 || !area) {
        return res
            .status(400)
            .json({ error: 'Thiếu thông tin dịch vụ hoặc diện tích.' });
    }

    try {
        let totalPrice = 0;
        let discount = 0;
        const breakdown = [];

        // tính từng item
        for (const id of selectedItems) {
            const detail = await ServiceDetail.findOne({
                where: { service_id, service_detail_id: id },
            });
            if (!detail) continue;
            const subTotal = detail.price * area;
            totalPrice += subTotal;
            breakdown.push({
                service: 'businessCleaning',
                name: detail.name,
                unitPrice: detail.price,
                multiplier: area,
                subTotal,
            });
        }

        // áp dụng voucher nếu có
        if (voucher_code) {
            const v = await Voucher.findOne({
                where: {
                    voucher_code,
                    expiry_date: { [Op.gt]: new Date() },
                },
                attributes: ['discount_percentage'],
                raw: true,
            });
            if (v) {
                discount = totalPrice * (v.discount_percentage / 100);
                totalPrice -= discount;
            }
        }

        return res.json({ totalPrice, discount, breakdown });
    } catch (err) {
        console.error('checkoutBusinessCleaning error:', err);
        return res.status(500).json({ error: 'System error' });
    }
};

module.exports = {
    checkoutHourly,
    checkoutPeriodic,
    checkoutACCleaning,
    checkoutUpholstery,
    checkoutBusinessCleaning,
};
