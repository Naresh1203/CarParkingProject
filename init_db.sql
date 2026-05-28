-- Database Initialization Script for Smart Parking System

CREATE DATABASE IF NOT EXISTS `smart_parking_db`;
USE `smart_parking_db`;

-- Users Table
CREATE TABLE IF NOT EXISTS `Users` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Email` longtext CHARACTER SET utf8mb4 NOT NULL,
    `PasswordHash` longtext CHARACTER SET utf8mb4 NOT NULL,
    `PhoneNumber` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Role` longtext CHARACTER SET utf8mb4 NOT NULL,
    PRIMARY KEY (`Id`)
);

-- ParkingSpots Table
CREATE TABLE IF NOT EXISTS `ParkingSpots` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Address` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Latitude` double NOT NULL,
    `Longitude` double NOT NULL,
    `PricePerHour` decimal(18,2) NOT NULL,
    `IsAvailable` tinyint(1) NOT NULL,
    `TotalCapacity` int NOT NULL DEFAULT 50,
    `AvailableSpots` int NOT NULL DEFAULT 50,
    `HostId` int NOT NULL,
    PRIMARY KEY (`Id`),
    FOREIGN KEY (`HostId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
);

-- Vehicles Table
CREATE TABLE IF NOT EXISTS `Vehicles` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Color` longtext CHARACTER SET utf8mb4 NOT NULL,
    `PlateNumber` longtext CHARACTER SET utf8mb4 NOT NULL,
    PRIMARY KEY (`Id`),
    FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS `Bookings` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `ParkingSpotId` int NOT NULL,
    `VehicleId` int NULL,
    `StartTime` datetime(6) NOT NULL,
    `EndTime` datetime(6) NOT NULL,
    `TotalPrice` decimal(18,2) NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `SlotNumber` longtext CHARACTER SET utf8mb4 NULL,
    `EntryImagePath` longtext CHARACTER SET utf8mb4 NULL,
    `ExitImagePath` longtext CHARACTER SET utf8mb4 NULL,
    PRIMARY KEY (`Id`),
    FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
    FOREIGN KEY (`ParkingSpotId`) REFERENCES `ParkingSpots` (`Id`) ON DELETE CASCADE,
    FOREIGN KEY (`VehicleId`) REFERENCES `Vehicles` (`Id`) ON DELETE SET NULL
);

-- Insert Admin User (Password: admin123)
-- Note: In a real app, use a hashed password. This is just for demo purposes if hashing is simple or logic is in app.
INSERT INTO `Users` (`Name`, `Email`, `PasswordHash`, `PhoneNumber`, `Role`) 
VALUES ('System Admin', 'admin@smartparking.com', 'admin123', '0000000000', 'Admin');
