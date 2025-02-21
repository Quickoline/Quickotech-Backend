require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        try {
            // Define Admin Schema if it doesn't exist
            const adminSchema = new mongoose.Schema({
                employeeId: {
                    type: String,
                    required: true,
                    unique: true
                },
                password: {
                    type: String,
                    required: true,
                    select: false
                },
                role: {
                    type: String,
                    enum: ['app_admin', 'web_admin', 'senior_admin', 'super_admin'],
                    required: true
                },
                name: String,
                isActive: {
                    type: Boolean,
                    default: true
                }
            });

            // Add password comparison method
            adminSchema.methods.comparePassword = async function(candidatePassword) {
                return await bcrypt.compare(candidatePassword, this.password);
            };

            // Create or get the Admin model
            const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

            // Super admin details
            const superAdmin = {
                employeeId: 'SUPER001',
                password: 'uperAdmin99@923',
                role: 'super_admin',
                name: 'Super Admin',
                isActive: true
            };

            // Check if super admin already exists
            const existingAdmin = await Admin.findOne({ employeeId: superAdmin.employeeId });
            
            if (existingAdmin) {
                console.log('Super admin already exists!');
                process.exit(0);
            }

            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(superAdmin.password, salt);

            // Create the super admin
            const newSuperAdmin = new Admin({
                ...superAdmin,
                password: hashedPassword
            });

            await newSuperAdmin.save();
            console.log('Super admin created successfully!');
            console.log('Employee ID:', superAdmin.employeeId);
            console.log('Password:', superAdmin.password);
            console.log('Please save these credentials securely and change the password on first login.');

        } catch (error) {
            console.error('Error creating super admin:', error);
        } finally {
            await mongoose.connection.close();
            process.exit(0);
        }
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }); 