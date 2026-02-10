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
            $rFields       = $db->getFieldData('redemptions');
            $hasUpdatedAtR = false;
            foreach ($rFields as $f) {
                if ($f->name === 'updated_at')
                    $hasUpdatedAtR = true;
            }
            if (!$hasUpdatedAtR) {
                $db->query("ALTER TABLE redemptions ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
                $output[] = "Added column 'updated_at' to redemptions.";
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

        } catch (\Exception $e) {
            $output[] = "Error: " . $e->getMessage();
        }

        return $this->response->setJSON($output);
    }
}
