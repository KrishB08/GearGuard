const mongoose = require('mongoose');
const { Team, User, Equipment, MaintenanceRequest } = require('./models');
const connectDB = require('./config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seed = async () => {
    try {
        await connectDB();

        // Clear existing data
        await Team.deleteMany({});
        await User.deleteMany({});
        await Equipment.deleteMany({});
        await MaintenanceRequest.deleteMany({});

        // Teams
        const mechanics = await Team.create({ name: 'Mechanics' });
        const electricians = await Team.create({ name: 'Electricians' });

        // Users
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const manager = await User.create({
            name: 'Alice Manager',
            email: 'alice@gearguard.com',
            password: hashedPassword,
            role: 'Manager',
            team_id: mechanics._id
        });
        const techBob = await User.create({
            name: 'Bob Tech',
            email: 'bob@gearguard.com',
            password: hashedPassword,
            role: 'Technician',
            team_id: mechanics._id,
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
        });
        const techCharlie = await User.create({
            name: 'Charlie Spark',
            email: 'charlie@gearguard.com',
            password: hashedPassword,
            role: 'Technician',
            team_id: electricians._id,
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie'
        });

        // Equipment
        const drill = await Equipment.create({
            name: 'Industrial Drill Press',
            serial_number: 'DP-2023-001',
            purchase_date: '2023-01-15',
            location: 'Workshop A',
            department: 'Production',
            maintenance_team_id: mechanics._id,
            technician_id: techBob._id
        });

        const generator = await Equipment.create({
            name: 'Backup Generator',
            serial_number: 'GEN-2022-999',
            purchase_date: '2022-05-20',
            location: 'Basement',
            department: 'Facilities',
            maintenance_team_id: electricians._id,
            technician_id: techCharlie._id
        });

        // Requests
        await MaintenanceRequest.create({
            subject: 'Drill Bit Wobble',
            request_type: 'Corrective',
            priority: 'High',
            status: 'New',
            equipment_id: drill._id,
            team_id: mechanics._id,
            technician_id: techBob._id
        });

        await MaintenanceRequest.create({
            subject: 'Monthly Inspection',
            request_type: 'Preventive',
            scheduled_date: new Date(new Date().setDate(new Date().getDate() + 5)),
            status: 'New',
            equipment_id: generator._id,
            team_id: electricians._id
        });

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seed();
