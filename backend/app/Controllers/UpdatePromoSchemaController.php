<?php

namespace App\Controllers;

use CodeIgniter\Controller;

class UpdatePromoSchemaController extends Controller
{
    public function update()
    {
        $db = \Config\Database::connect();

        $output   = [];
        $output[] = "Updating Promo Codes Schema...";

        try {
            // Check if column used_ip exists in promo_codes
            $fields = $db->getFieldData('promo_codes');
            $exists = false;
            foreach ($fields as $field) {
                if ($field->name === 'used_ip') {
                    $exists = true;
                    break;
                }
            }

            if (!$exists) {
                // MySQL Alter
                $db->query("ALTER TABLE promo_codes ADD COLUMN used_ip VARCHAR(45) AFTER used_at");
                $output[] = "Added column 'used_ip' to promo_codes.";
            } else {
                $output[] = "Column 'used_ip' already exists.";
            }

            // Update Users Table for Colonia/Municipio
            $userFields   = $db->getFieldData('users');
            $hasColonia   = false;
            $hasMunicipio = false;

            foreach ($userFields as $f) {
                if ($f->name === 'colonia')
                    $hasColonia = true;
                if ($f->name === 'municipio')
                    $hasMunicipio = true;
            }

            if (!$hasColonia) {
                $db->query("ALTER TABLE users ADD COLUMN colonia VARCHAR(255) DEFAULT NULL AFTER address");
                $output[] = "Added column 'colonia' to users.";
            }
            if (!$hasMunicipio) {
                $db->query("ALTER TABLE users ADD COLUMN municipio VARCHAR(255) DEFAULT NULL AFTER colonia");
                $output[] = "Added column 'municipio' to users.";
            }

            // Update Reward Codes Table
            $rcFields       = $db->getFieldData('reward_codes');
            $hasCreatedAtRC = false;
            $hasUpdatedAtRC = false;
            foreach ($rcFields as $f) {
                if ($f->name === 'created_at')
                    $hasCreatedAtRC = true;
                if ($f->name === 'updated_at')
                    $hasUpdatedAtRC = true;
            }
            if (!$hasCreatedAtRC) {
                $db->query("ALTER TABLE reward_codes ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP");
                $output[] = "Added column 'created_at' to reward_codes.";
            }
            if (!$hasUpdatedAtRC) {
                $db->query("ALTER TABLE reward_codes ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
                $output[] = "Added column 'updated_at' to reward_codes.";
            }

            // Update Redemptions Table
            $rFields   = $db->getFieldData('redemptions');
            $existingR = [];
            foreach ($rFields as $f) {
                $existingR[] = $f->name;
            }

            if (!in_array('updated_at', $existingR)) {
                $db->query("ALTER TABLE redemptions ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
                $output[] = "Added column 'updated_at' to redemptions.";
            }
            if (!in_array('admin_notes', $existingR)) {
                $db->query("ALTER TABLE redemptions ADD COLUMN admin_notes TEXT DEFAULT NULL");
                $output[] = "Added column 'admin_notes' to redemptions.";
            }
            if (!in_array('tracking_number', $existingR)) {
                $db->query("ALTER TABLE redemptions ADD COLUMN tracking_number VARCHAR(255) DEFAULT NULL");
                $output[] = "Added column 'tracking_number' to redemptions.";
            }
            if (!in_array('tracking_url', $existingR)) {
                $db->query("ALTER TABLE redemptions ADD COLUMN tracking_url TEXT DEFAULT NULL");
                $output[] = "Added column 'tracking_url' to redemptions.";
            }
            if (!in_array('delivery_date', $existingR)) {
                $db->query("ALTER TABLE redemptions ADD COLUMN delivery_date DATE DEFAULT NULL");
                $output[] = "Added column 'delivery_date' to redemptions.";
            }

            // Update Security Logs Table
            $slFields     = $db->getFieldData('security_logs');
            $hasUserIdSL  = false;
            $hasDetailsSL = false;
            foreach ($slFields as $f) {
                if ($f->name === 'user_id')
                    $hasUserIdSL = true;
                if ($f->name === 'details')
                    $hasDetailsSL = true;
            }
            if (!$hasUserIdSL) {
                $db->query("ALTER TABLE security_logs ADD COLUMN user_id INT UNSIGNED DEFAULT NULL AFTER ip_address");
                $output[] = "Added column 'user_id' to security_logs.";
            }
            if (!$hasDetailsSL) {
                $db->query("ALTER TABLE security_logs ADD COLUMN details TEXT DEFAULT NULL AFTER action");
                $output[] = "Added column 'details' to security_logs.";
            }

            // Update Support Tickets Table
            $stFields    = $db->getFieldData('support_tickets');
            $hasCategory = false;
            foreach ($stFields as $f) {
                if ($f->name === 'category')
                    $hasCategory = true;
            }
            if (!$hasCategory) {
                $db->query("ALTER TABLE support_tickets ADD COLUMN category VARCHAR(100) DEFAULT 'general' AFTER subject");
                $output[] = "Added column 'category' to support_tickets.";
            }

            // Update Users Table for Delivery Instructions
            $userFields      = $db->getFieldData('users');
            $hasInstructions = false;
            foreach ($userFields as $f) {
                if ($f->name === 'delivery_instructions')
                    $hasInstructions = true;
            }
            if (!$hasInstructions) {
                $db->query("ALTER TABLE users ADD COLUMN delivery_instructions TEXT DEFAULT NULL AFTER state");
                $output[] = "Added column 'delivery_instructions' to users.";
            }

            // Block status columns
            $hasBlockedStatus = false;
            foreach ($userFields as $f) {
                if ($f->name === 'is_blocked')
                    $hasBlockedStatus = true;
            }
            if (!$hasBlockedStatus) {
                $db->query("ALTER TABLE users 
                    ADD COLUMN is_blocked TINYINT(1) DEFAULT 0,
                    ADD COLUMN blocked_reason TEXT DEFAULT NULL,
                    ADD COLUMN blocked_at DATETIME DEFAULT NULL");
                $output[] = "Added block status columns to users.";
            }

            // Site Visits Table
            $tables = $db->listTables();
            if (!in_array('site_visits', $tables)) {
                $db->query("CREATE TABLE site_visits (
                    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    page_url VARCHAR(255),
                    user_id INT UNSIGNED NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )");
                $output[] = "Created table 'site_visits'.";
            }

            // ADD INDEXES TO PROMO_CODES
            $output[] = "Optimizing promo_codes indexes...";

            // Check existing indexes for promo_codes
            $indexQuery = $db->query("SHOW INDEX FROM promo_codes");
            $indexes    = $indexQuery->getResult();
            $indexNames = array_map(function ($idx) {
                return $idx->Key_name; }, $indexes);

            if (!in_array('idx_user_daily', $indexNames)) {
                $db->query("ALTER TABLE promo_codes ADD INDEX idx_user_daily (used_by, used_at)");
                $output[] = "Added index 'idx_user_daily'.";
            }
            if (!in_array('idx_ip_daily', $indexNames)) {
                $db->query("ALTER TABLE promo_codes ADD INDEX idx_ip_daily (used_ip, used_at)");
                $output[] = "Added index 'idx_ip_daily'.";
            }
            if (!in_array('idx_available', $indexNames)) {
                $db->query("ALTER TABLE promo_codes ADD INDEX idx_available (is_used, code)");
                $output[] = "Added index 'idx_available'.";
            }
            if (!in_array('idx_used_at', $indexNames)) {
                $db->query("ALTER TABLE promo_codes ADD INDEX idx_used_at (used_at)");
                $output[] = "Added index 'idx_used_at'.";
            }
        } catch (\Exception $e) {
            $output[] = "Error: " . $e->getMessage();
        }

        return $this->response->setJSON($output);
    }

    public function manualUpdatePoints()
    {
        $points = $this->request->getGet('points');
        
        if ($points === null || !is_numeric($points)) {
            return $this->response->setJSON(['error' => 'Please provide a numeric points parameter.']);
        }

        $db = \Config\Database::connect();
        $builder = $db->table('promo_codes');
        
        try {
            $builder->where('is_used', 0)
                    ->set(['points' => (int)$points])
                    ->update();
            
            $affectedRows = $db->affectedRows();
            return $this->response->setJSON([
                'success' => true,
                'message' => "Points updated to $points for $affectedRows codes.",
                'affected_rows' => $affectedRows
            ]);
        } catch (\Exception $e) {
            return $this->response->setJSON(['error' => $e->getMessage()]);
        }
    }
}
