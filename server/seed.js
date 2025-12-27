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

        // Teams (Departments)
        const mechanics = await Team.create({ name: 'Mechanics' });
        const electricians = await Team.create({ name: 'Electricians' });
        const facilities = await Team.create({ name: 'Facilities' });

        // Users
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // SUPER ADMIN - Hardcoded/Seeded (Cannot signup publicly)
        const admin = await User.create({
            name: 'Super Admin',
            email: 'admin@gearguard.com',
            password: hashedPassword,
            role: 'Admin',
            // Admin doesn't necessarily need a team, but good for data consistency if needed
        });

        const worker = await User.create({
            name: 'John Worker',
            email: 'worker@gearguard.com',
            password: hashedPassword,
            role: 'Worker',
        });

        const techBob = await User.create({
            name: 'Bob Mechanic',
            email: 'bob@gearguard.com',
            password: hashedPassword,
            role: 'Technician',
            team_id: mechanics._id,
            avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
        });

        const techCharlie = await User.create({
            name: 'Charlie Electrician',
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
            technician_id: techBob._id, // Default tech
            assigned_employee_id: worker._id
        });

        const generator = await Equipment.create({
            name: 'Backup Generator',
            serial_number: 'GEN-2022-999',
            purchase_date: '2022-05-20',
            location: 'Basement',
            department: 'Facilities',
            maintenance_team_id: electricians._id,
            // No default technician, just team
        });

        // Requests
        // 1. Worker created request for Drill (Should auto-assign to Bob)
        await MaintenanceRequest.create({
            subject: 'Drill Bit Wobble',
            request_type: 'Corrective',
            priority: 'High',
            status: 'New',
            equipment_id: drill._id,
            team_id: mechanics._id,
            technician_id: techBob._id,
            created_by: worker._id
        });

        // 2. Worker created request for Generator (Should auto-assign to Team Electricians)
        await MaintenanceRequest.create({
            subject: 'Monthly Inspection',
            request_type: 'Preventive',
            scheduled_date: new Date(new Date().setDate(new Date().getDate() + 5)),
            status: 'New',
            equipment_id: generator._id,
            team_id: electricians._id,
            // No specific tech yet
            created_by: worker._id
        });

        console.log('Database seeded successfully!');
        console.log('Admin: admin@gearguard.com / password123');
        console.log('Worker: worker@gearguard.com / password123');
        console.log('Tech: bob@gearguard.com / password123');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seed();
