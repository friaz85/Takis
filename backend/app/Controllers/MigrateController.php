<?php

namespace App\Controllers;

use CodeIgniter\Controller;

class MigrateController extends Controller
{
    public function index()
    {
        $db = \Config\Database::connect();

        // Try adding columns without IF NOT EXISTS for compatibility
        try {
            $db->query("ALTER TABLE users ADD COLUMN otp VARCHAR(10) NULL");
            echo "Added otp. ";
        } catch (\Throwable $e) {
            echo "otp error (maybe exists): " . $e->getMessage() . " ";
        }

        try {
            $db->query("ALTER TABLE users ADD COLUMN otp_expiry DATETIME NULL");
            echo "Added otp_expiry. ";
        } catch (\Throwable $e) {
            echo "otp_expiry error (maybe exists): " . $e->getMessage() . " ";
        }

        echo "Migration Attempt Finished.";
    }
}
