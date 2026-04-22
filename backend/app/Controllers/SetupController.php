<?php

namespace App\Controllers;

use CodeIgniter\Controller;

class SetupController extends Controller
{
    public function index()
    {
        $db = \Config\Database::connect();

        $output   = [];
        $output[] = "Starting Setup for MySQL...";

        // 1. Schema Creation
        $queries = [
            "DROP TABLE IF EXISTS security_logs",
            "DROP TABLE IF EXISTS reward_codes",
            "DROP TABLE IF EXISTS promo_codes",
            "DROP TABLE IF EXISTS ticket_replies",
            "DROP TABLE IF EXISTS tickets",
            "DROP TABLE IF EXISTS redemptions",
            "DROP TABLE IF EXISTS rewards",
            "DROP TABLE IF EXISTS users",

            "CREATE TABLE users (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                phone VARCHAR(20),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                zip_code VARCHAR(10),
                points INT DEFAULT 0,
                is_verified TINYINT(1) DEFAULT 0,
                role ENUM('user', 'admin') DEFAULT 'user',
                otp VARCHAR(6),
                otp_expiry DATETIME,
                session_version INT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )",

            "CREATE TABLE rewards (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                cost INT NOT NULL,
                stock INT NOT NULL,
                image_url VARCHAR(255),
                type ENUM('physical', 'digital') DEFAULT 'physical',
                pdf_template VARCHAR(255),
                coordinates TEXT,
                code_areas TEXT,
                font_size INT DEFAULT 12,
                active TINYINT(1) DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",

            "CREATE TABLE redemptions (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id INT UNSIGNED NOT NULL,
                reward_id INT UNSIGNED NOT NULL,
                status ENUM('pending', 'review', 'processing', 'shipped', 'delivered', 'completed') DEFAULT 'pending',
                shipping_details JSON,
                digital_code TEXT,
                pdf_path VARCHAR(255),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (reward_id) REFERENCES rewards(id)
            )",

            "CREATE TABLE reward_codes (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                reward_id INT UNSIGNED,
                redemption_id INT UNSIGNED,
                code VARCHAR(50) NOT NULL,
                is_used TINYINT(1) DEFAULT 0,
                FOREIGN KEY (redemption_id) REFERENCES redemptions(id)
            )",

            "CREATE TABLE promo_codes (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(20) NOT NULL UNIQUE,
                points INT NOT NULL,
                is_used TINYINT(1) DEFAULT 0,
                used_by INT UNSIGNED,
                used_at DATETIME,
                FOREIGN KEY (used_by) REFERENCES users(id)
            )",

            "CREATE TABLE security_logs (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                ip_address VARCHAR(45) NOT NULL,
                action VARCHAR(100) NOT NULL,
                attempts INT DEFAULT 1,
                last_attempt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                is_blocked TINYINT(1) DEFAULT 0
            )"
        ];

        foreach ($queries as $sql) {
            try {
                $db->query($sql);
            } catch (\Exception $e) {
                $output[] = "Error executing SQL: " . $e->getMessage();
            }
        }
        $output[] = "Schema created.";

        // 2. Insert Base Data

        // Rewards
        // Need to replicate the 'Amazon $300' reward. 
        // Previously it was ID 2, we will try to force ID if possible or just use whatever.
        // Let's insert ID 1 first just to pad if we really want ID 2, but better to just use ID 1 for Amazon now.
        // Wait, the client might have had 'Takis' reward as ID 1.
        // I'll simple insert the Amazon one.

        $amazonReward = [
            'title'        => 'Tarjea de Regalo Amazon $300',
            'description'  => 'Canjea tus puntos por una tarjeta digital de Amazon.',
            'cost'         => 500, // Example cost
            'stock'        => 5,
            'image_url'    => 'assets/img/rewards/amazon.png', // Placeholder
            'type'         => 'digital',
            'pdf_template' => 'amazon_template.pdf',
            'active'       => 1
        ];

        // Insert and get ID
        $db->table('rewards')->insert($amazonReward);
        $rewardId = $db->insertID();
        $output[] = "Inserted Reward ID: $rewardId";

        // Reward Codes
        $rewardCodes = [
            'AMZN-XJ82-92KA',
            'AMZN-928A-J211',
            'AMZN-LL19-282A',
            'AMZN-KK22-8172',
            'AMZN-MM00-1122'
        ];

        foreach ($rewardCodes as $rc) {
            $db->table('reward_codes')->insert([
                'reward_id' => $rewardId,
                'code'      => $rc,
                'is_used'   => 0
            ]);
        }
        $output[] = "Inserted " . count($rewardCodes) . " reward codes.";

        // Promo Codes (All 1 pt)
        $promoCodes = [
            'DEMO-100',
            'DEMO-500',
            'DEMO-1000',
            'TAKIS-WIN',
            'INTENSO-50'
        ];

        foreach ($promoCodes as $pc) {
            $db->table('promo_codes')->insert([
                'code'    => $pc,
                'points'  => 1,
                'is_used' => 0
            ]);
        }
        $output[] = "Inserted " . count($promoCodes) . " promo codes.";

        return $this->response->setJSON($output);
    }
}
