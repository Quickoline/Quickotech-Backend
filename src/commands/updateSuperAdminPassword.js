const mongoose = require('mongoose');
const Admin = require('../api/v1/auth/models/admin.model');
require('dotenv').config();

const updateSuperAdminPassword = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find super admin
        const superAdmin = await Admin.findOne({ role: 'super_admin' });
        if (!superAdmin) {
            console.log('Super admin not found!');
            process.exit(0);
        }

        // Update password and name
        superAdmin.password = process.env.SUPER_ADMIN_PASSWORD || '@Vechno101@989';
        superAdmin.name = process.env.SUPER_ADMIN_NAME || 'Super Admin';
        await superAdmin.save();

        console.log('Super admin updated successfully:', {
            employeeId: superAdmin.employeeId,
            role: superAdmin.role,
            name: superAdmin.name
        });

    } catch (error) {
        console.error('Error updating super admin password:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

// Run the command
updateSuperAdminPassword(); 