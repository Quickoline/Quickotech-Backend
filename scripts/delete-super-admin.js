require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        try {
            // Define Admin Schema (same as in setup script)
            const adminSchema = new mongoose.Schema({
                employeeId: String,
                password: String,
                role: String,
                name: String,
                isActive: Boolean
            });

            // Get the Admin model
            const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

            // Delete the super admin
            const result = await Admin.deleteOne({ 
                employeeId: 'SUPER001',
                role: 'super_admin'
            });

            if (result.deletedCount > 0) {
                console.log('Super admin deleted successfully!');
            } else {
                console.log('Super admin not found!');
            }

        } catch (error) {
            console.error('Error deleting super admin:', error);
        } finally {
            await mongoose.connection.close();
            process.exit(0);
        }
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }); 