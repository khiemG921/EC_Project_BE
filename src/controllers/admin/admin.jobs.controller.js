const sequelize = require('../../config/db'); // Assuming you have a sequelize instance configured
const { QueryTypes } = require('sequelize');

const loadAllJobs = async (req, res) => {
    try {
        // Lấy danh sách job kèm các quan hệ
        const rows = await sequelize.query(
        `
            SELECT
                j.job_id,
                j.customer_id,
                j.tasker_id,
                j.service_id,
                j.location,
                j.status AS job_status,
                j.created_at,
                j.completed_at,
                j.noted,
                c.name AS customer_name,
                c.avatar_url AS customer_avatar,
                c.phone AS customer_phone,
                t.name AS tasker_name,
                t.avatar_url AS tasker_avatar,
                (SELECT sc.phone FROM customer AS sc WHERE t.firebase_id = sc.firebase_id) AS tasker_phone,
                s.name AS service_name,
                tr.transaction_id,
                tr.amount,
                tr.platform_fee,
                tr.currency,
                tr.payment_gateway,
                tr.status AS transaction_status,
                tr.paid_at
            FROM 
                job AS j
            JOIN 
                customer AS c ON j.customer_id = c.customer_id
            LEFT JOIN 
                tasker AS t ON j.tasker_id = t.tasker_id
            JOIN 
                service AS s ON j.service_id = s.service_id
            JOIN
                transaction AS tr ON j.job_id = tr.job_id
        `,
            { type: QueryTypes.SELECT }
        );

        return res.status(200).json(rows);
    } catch (err) {
        console.error('❌ loadAllJobs error:', err);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    loadAllJobs,
};
