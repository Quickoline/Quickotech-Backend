const mongoose = require('mongoose');
const Admin = require('../api/v1/auth/models/admin.model');
require('dotenv').config();

const createSuperAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if super admin already exists
        const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
        if (existingSuperAdmin) {
            console.log('Super admin already exists!');
            process.exit(0);
        }

        // Create super admin
        const superAdmin = await Admin.create({
            employeeId: process.env.SUPER_ADMIN_ID || 'SUPER001',
            password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin123',
            role: 'super_admin',
            name: 'Super Admin'
        });

        console.log('Super admin created successfully:', {
            employeeId: superAdmin.employeeId,
            role: superAdmin.role
        });

    } catch (error) {
        console.error('Error creating super admin:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

// Run the command
createSuperAdmin(); 